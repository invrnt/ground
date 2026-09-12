import { createHash, createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { GroundError, normalizedMessageSchema, type ChannelAdapter, type ChannelBinding, type ConfirmedSend, type IncomingUpdate, type NormalizedMessage } from '@ground/contracts';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_AUDIO_SECONDS = 60;
/** Slack rejects a signed request whose timestamp is further than this from now. */
const MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000;

/** Proof that an update arrived in-process over Socket Mode, so no HTTP signature exists. */
export const SOCKET_MODE_TRUSTED: unique symbol = Symbol('slack.socket-mode');

const file = z.object({ id: z.string(), name: z.string().optional(), title: z.string().optional(), mimetype: z.string().optional(), filetype: z.string().optional(), size: z.number().int().nonnegative().optional(), duration_ms: z.number().int().nonnegative().optional(), mode: z.string().optional() });
const body = z.object({ subtype: z.string().optional(), ts: z.string(), thread_ts: z.string().optional(), user: z.string().optional(), bot_id: z.string().optional(), text: z.string().optional(), files: z.array(file).optional(), edited: z.object({ user: z.string(), ts: z.string() }).optional() });
const messageEvent = body.extend({ type: z.literal('message'), channel: z.string(), message: body.optional(), previous_message: body.optional() });
const eventCallback = z.object({ type: z.literal('event_callback'), event_id: z.string(), team_id: z.string().optional(), event: messageEvent });
const blockActions = z.object({ type: z.literal('block_actions'), user: z.object({ id: z.string() }), channel: z.object({ id: z.string() }).optional(), response_url: z.string().url().optional(), message: z.object({ ts: z.string() }).optional(), actions: z.array(z.object({ action_id: z.string(), value: z.string().optional(), action_ts: z.string() })).min(1) });
const update = z.union([eventCallback, blockActions]);

export interface SlackConfig { token: string; signing_secret: string; timeout_ms?: number }

export class SlackProviderError extends GroundError {
  constructor(retryable: boolean, public readonly retry_after_ms: number | undefined) { super('PROVIDER_UNAVAILABLE', 'Slack rejected the request', retryable); }
}

/** Slack timestamps are "1726149600.000400" seconds; the fractional part orders messages. */
function tsToIso(ts: string): string {
  const seconds = Number(ts.split('.')[0]);
  if (!Number.isFinite(seconds)) throw new GroundError('VALIDATION_ERROR', 'Slack timestamp is invalid');
  return new Date(seconds * 1000).toISOString();
}

function kindOf(f: z.infer<typeof file>): 'audio' | 'photo' | 'document' {
  const mime = (f.mimetype ?? '').toLowerCase(), type = (f.filetype ?? '').toLowerCase();
  if (mime.startsWith('image/')) return 'photo';
  if (mime.startsWith('audio/') || ['m4a', 'mp3', 'ogg', 'wav', 'webm', 'mp4'].includes(type)) return 'audio';
  return 'document';
}

export class SlackChannelAdapter implements ChannelAdapter {
  readonly provider = 'slack' as const;
  constructor(private readonly config: SlackConfig, private readonly fetcher: typeof fetch = fetch) {
    if (!config.token || config.signing_secret.length < 16) throw new GroundError('NOT_READY', 'Slack configuration is missing');
  }

  /**
   * Accepts either the sentinel for an in-process Socket Mode delivery, or the HTTP
   * signature triple. The sentinel is a symbol, so it can never arrive over the wire.
   */
  verifyWebhook(secret: unknown): void {
    if (secret === SOCKET_MODE_TRUSTED) return;
    const parsed = z.object({ signature: z.string(), timestamp: z.string(), body: z.string() }).safeParse(secret);
    if (!parsed.success) throw new GroundError('UNAUTHORIZED', 'Slack signature is missing');
    const age = Math.abs(Date.now() - Number(parsed.data.timestamp) * 1000);
    if (!Number.isFinite(age) || age > MAX_SIGNATURE_AGE_MS) throw new GroundError('UNAUTHORIZED', 'Slack signature is stale');
    const expected = Buffer.from('v0=' + createHmac('sha256', this.config.signing_secret).update(`v0:${parsed.data.timestamp}:${parsed.data.body}`).digest('hex'));
    const actual = Buffer.from(parsed.data.signature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new GroundError('UNAUTHORIZED', 'Invalid webhook authentication');
  }

  inspectUpdate(raw: unknown): IncomingUpdate {
    const parsed = update.safeParse(raw);
    if (!parsed.success) throw new GroundError('VALIDATION_ERROR', 'Invalid Slack update');
    const u = parsed.data;
    if (u.type === 'block_actions') {
      const action = u.actions[0];
      if (!action || !u.channel) throw new GroundError('VALIDATION_ERROR', 'Unsupported Slack interaction');
      const context = Buffer.from(JSON.stringify({ channel: u.channel.id, user: u.user.id, response_url: u.response_url ?? null })).toString('base64url');
      return { update_id: `action:${action.action_ts}`, chat_id: u.channel.id, sender_id: u.user.id, message_id: `callback:${action.action_ts}`, sent_at: tsToIso(action.action_ts), callback: { id: context, data: action.value ?? '' }, raw };
    }
    const event = u.event;
    const content = event.subtype === 'message_changed' ? event.message : event;
    if (!content) throw new GroundError('VALIDATION_ERROR', 'Unsupported Slack update');
    const sender = content.user;
    if (!sender) throw new GroundError('VALIDATION_ERROR', 'Slack author is missing');
    return { update_id: u.event_id, chat_id: event.channel, sender_id: sender, message_id: content.ts, sent_at: tsToIso(content.ts), callback: null, raw };
  }

  normalizeUpdate(raw: unknown, binding: ChannelBinding, received_at = new Date().toISOString()): NormalizedMessage {
    const u = update.parse(raw);
    const inspected = this.inspectUpdate(raw);
    const content = u.type === 'event_callback' ? (u.event.subtype === 'message_changed' ? u.event.message : u.event) : undefined;
    const media: NormalizedMessage['media'] = [];
    for (const f of content?.files ?? []) media.push({ id: randomUUID(), provider_file_id: f.id, mime_type: f.mimetype ?? 'application/octet-stream', filename: f.name ?? f.title ?? null, size_bytes: f.size ?? null, kind: kindOf(f), sha256: null });
    /** A Slack thread reply carries the parent ts; a top-level message repeats its own. */
    const parent = content?.thread_ts && content.thread_ts !== content.ts ? content.thread_ts : null;
    return normalizedMessageSchema.parse({ provider: 'slack', ...binding, update_id: inspected.update_id, chat_id: inspected.chat_id, message_id: inspected.message_id, sender_id: inspected.sender_id, text: content?.text ?? null, sent_at: inspected.sent_at, received_at, reply_to_message_id: parent, media });
  }

  intakeError(raw: unknown): string | null {
    const u = update.safeParse(raw);
    if (!u.success || u.data.type === 'block_actions') return null;
    const event = u.data.event;
    const content = event.subtype === 'message_changed' ? event.message : event;
    if (!content) return null;
    const files = content.files ?? [];
    if (!content.text && files.length === 0) return 'Envía texto, audio, una foto o un PDF.';
    if (files.some(f => f.mode === 'tombstone' || f.mode === 'hidden_by_limit')) return 'Slack ya no conserva ese archivo. Vuelve a enviarlo.';
    for (const f of files) {
      const kind = kindOf(f);
      if (kind === 'audio' && Math.round((f.duration_ms ?? 0) / 1000) > MAX_AUDIO_SECONDS) return `El audio debe durar como máximo ${MAX_AUDIO_SECONDS} segundos.`;
      if (kind === 'document' && (f.mimetype ?? '') !== 'application/pdf') return 'Solo se aceptan documentos PDF de hasta cinco páginas.';
      if ((f.size ?? 0) > MAX_FILE_BYTES) return 'Cada archivo debe pesar como máximo 10 MB.';
    }
    return null;
  }

  private async call(method: string, payload: object, effect: boolean): Promise<Record<string, unknown>> {
    try {
      const response = await this.fetcher(`https://slack.com/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8', authorization: `Bearer ${this.config.token}` }, body: JSON.stringify(payload), signal: AbortSignal.timeout(this.config.timeout_ms ?? 15000) });
      const parsed = z.object({ ok: z.boolean(), error: z.string().optional() }).passthrough().safeParse(await response.json());
      if (!parsed.success) throw new GroundError(effect ? 'UNCERTAIN' : 'PROVIDER_UNAVAILABLE', 'Slack returned an unreadable response', !effect);
      if (!parsed.data.ok) {
        const retryable = parsed.data.error === 'ratelimited' || response.status === 429 || response.status >= 500;
        const after = Number(response.headers.get('retry-after'));
        throw new SlackProviderError(retryable, Number.isFinite(after) ? Math.min(after * 1000, 3600000) : undefined);
      }
      return parsed.data as Record<string, unknown>;
    } catch (error) {
      if (error instanceof GroundError) throw error;
      throw new GroundError(effect ? 'UNCERTAIN' : 'PROVIDER_UNAVAILABLE', effect ? 'Slack delivery may have occurred' : 'Slack is unavailable', !effect);
    }
  }

  /** Slack file bytes are behind the bot token, so the private URL is resolved per download. */
  async downloadFile(file_id: string): Promise<{ bytes: Uint8Array; content_type: string; sha256: string }> {
    const info = z.object({ file: z.object({ url_private_download: z.string().url().optional(), url_private: z.string().url().optional(), size: z.number().int().nonnegative().optional() }) }).parse(await this.call('files.info', { file: file_id }, false));
    const url = info.file.url_private_download ?? info.file.url_private;
    if (!url) throw new GroundError('VALIDATION_ERROR', 'Slack file has no download url');
    if ((info.file.size ?? 0) > MAX_FILE_BYTES) throw new GroundError('VALIDATION_ERROR', 'File exceeds 10 MB');
    try {
      const response = await this.fetcher(url, { headers: { authorization: `Bearer ${this.config.token}` }, signal: AbortSignal.timeout(this.config.timeout_ms ?? 15000), redirect: 'error' });
      if (!response.ok || !response.body) throw new GroundError('PROVIDER_UNAVAILABLE', 'Slack file is unavailable', true);
      /** Slack serves the login page with 200 when the token cannot read the file. */
      const type = response.headers.get('content-type')?.split(';')[0] ?? 'application/octet-stream';
      if (type === 'text/html') throw new GroundError('UNAUTHORIZED', 'Slack denied the file download');
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        length += chunk.value.byteLength;
        if (length > MAX_FILE_BYTES) { await reader.cancel(); throw new GroundError('VALIDATION_ERROR', 'File exceeds 10 MB'); }
        chunks.push(chunk.value);
      }
      const bytes = Buffer.concat(chunks);
      return { bytes, content_type: type, sha256: createHash('sha256').update(bytes).digest('hex') };
    } catch (error) {
      if (error instanceof GroundError) throw error;
      throw new GroundError('PROVIDER_UNAVAILABLE', 'Slack file download failed', true);
    }
  }

  async sendMessage(input: { recipient_id: string; text: string; reply_to_message_id?: string }): Promise<ConfirmedSend> {
    if (input.text.length < 1 || input.text.length > 4000) throw new GroundError('VALIDATION_ERROR', 'Slack text length is invalid');
    const result = z.object({ ts: z.string(), channel: z.string() }).safeParse(await this.call('chat.postMessage', { channel: input.recipient_id, text: input.text, unfurl_links: false, unfurl_media: false, ...(input.reply_to_message_id ? { thread_ts: input.reply_to_message_id } : {}) }, true));
    if (!result.success) throw new GroundError('UNCERTAIN', 'Slack delivery confirmation is invalid');
    return { message_id: result.data.ts, chat_id: result.data.channel, sent_at: tsToIso(result.data.ts) };
  }

  /** Slack has no callback toast, so the acknowledgement is an ephemeral only the tapper sees. */
  async answerCallback(callback_query_id: string, text: string): Promise<void> {
    const context = z.object({ channel: z.string(), user: z.string() }).safeParse(JSON.parse(Buffer.from(callback_query_id, 'base64url').toString('utf8')));
    if (!context.success) throw new GroundError('VALIDATION_ERROR', 'Slack interaction context is invalid');
    await this.call('chat.postEphemeral', { channel: context.data.channel, user: context.data.user, text: text.slice(0, 3000) }, true);
  }
}
