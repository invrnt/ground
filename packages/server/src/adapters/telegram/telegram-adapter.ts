import { timingSafeEqual, randomUUID, createHash } from 'node:crypto';
import { z } from 'zod';
import { GroundError, normalizedMessageSchema, type ChannelAdapter, type ChannelBinding, type ConfirmedSend, type IncomingUpdate, type NormalizedMessage, type TelegramAdapter } from '@ground/contracts';

const integer = z.number().int().safe();
const file = z.object({ file_id: z.string(), file_unique_id: z.string(), file_size: integer.nonnegative().optional(), mime_type: z.string().optional(), file_name: z.string().optional(), duration: integer.nonnegative().optional() });
const message = z.object({ message_id: integer, date: integer, chat: z.object({ id: integer }), from: z.object({ id: integer, is_bot: z.boolean().optional() }), text: z.string().optional(), caption: z.string().optional(), reply_to_message: z.object({ message_id: integer }).optional(), voice: file.optional(), audio: file.optional(), photo: z.array(file).optional(), document: file.optional(), video: z.unknown().optional() });
const update = z.object({ update_id: integer, message: message.optional(), callback_query: z.object({ id: z.string(), from: z.object({ id: integer }), message: message.omit({ from: true }).optional(), data: z.string().max(64).optional() }).optional() });
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export type { ChannelBinding as TelegramBinding, IncomingUpdate, ConfirmedSend } from '@ground/contracts';
const envelope = z.object({ ok: z.boolean(), result: z.unknown().optional(), error_code: integer.optional(), parameters: z.object({ retry_after: integer.nonnegative().optional() }).optional() });
export class TelegramProviderError extends GroundError {
  constructor(retryable: boolean, public readonly retry_after_ms: number | undefined) { super('PROVIDER_UNAVAILABLE', 'Telegram rejected the request', retryable); }
}

export class BotTelegramAdapter implements TelegramAdapter, ChannelAdapter {
  readonly provider = 'telegram' as const;
  constructor(private readonly config: { token: string; webhook_secret: string; timeout_ms?: number }, private readonly fetcher: typeof fetch = fetch) {
    if (!config.token || !/^[A-Za-z0-9_-]{1,256}$/.test(config.webhook_secret)) throw new GroundError('NOT_READY', 'Telegram configuration is missing');
  }
  verifyWebhook(secret: unknown): void {
    const actual = Buffer.from(typeof secret === 'string' ? secret : '');
    const expected = Buffer.from(this.config.webhook_secret);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new GroundError('UNAUTHORIZED', 'Invalid webhook authentication');
  }
  inspectUpdate(raw: unknown): IncomingUpdate {
    const parsed = update.safeParse(raw);
    if (!parsed.success) throw new GroundError('VALIDATION_ERROR', 'Invalid Telegram update');
    const u = parsed.data;
    const m = u.message ?? u.callback_query?.message;
    if (!m) throw new GroundError('VALIDATION_ERROR', 'Unsupported Telegram update');
    const sender = u.callback_query?.from.id ?? u.message?.from.id;
    if (sender === undefined) throw new GroundError('VALIDATION_ERROR', 'Telegram author is missing');
    return { update_id: String(u.update_id), chat_id: String(m.chat.id), sender_id: String(sender), message_id: u.callback_query ? `callback:${u.callback_query.id}` : String(m.message_id), sent_at: new Date(m.date * 1000).toISOString(), callback: u.callback_query ? { id: u.callback_query.id, data: u.callback_query.data ?? '' } : null, raw };
  }
  normalizeUpdate(raw: unknown, binding: ChannelBinding, received_at = new Date().toISOString()): NormalizedMessage {
    const u = update.parse(raw);
    const inspected = this.inspectUpdate(raw);
    const m = u.message;
    const media: NormalizedMessage['media'] = [];
    const add = (f: z.infer<typeof file>, kind: 'audio' | 'photo' | 'document', mime: string) => {
      media.push({ id: randomUUID(), provider_file_id: f.file_id, mime_type: f.mime_type ?? mime, filename: f.file_name ?? null, size_bytes: f.file_size ?? null, kind, sha256: null });
    };
    if (m?.voice) add(m.voice, 'audio', 'audio/ogg');
    if (m?.audio) add(m.audio, 'audio', 'audio/mpeg');
    const photo = m?.photo?.at(-1);
    if (photo) add(photo, 'photo', 'image/jpeg');
    if (m?.document) add(m.document, 'document', 'application/octet-stream');
    return normalizedMessageSchema.parse({ provider: 'telegram', ...binding, update_id: inspected.update_id, chat_id: inspected.chat_id, message_id: inspected.message_id, sender_id: inspected.sender_id, text: m?.text ?? m?.caption ?? null, sent_at: inspected.sent_at, received_at, reply_to_message_id: m?.reply_to_message ? String(m.reply_to_message.message_id) : null, media });
  }
  intakeError(raw: unknown): string | null {
    const m = update.parse(raw).message;
    if (!m) return null;
    if (m.video !== undefined || (!m.text && !m.caption && !m.voice && !m.audio && !m.photo?.length && !m.document)) return 'Envía texto, audio, una foto o un PDF.';
    if ((m.voice?.duration ?? m.audio?.duration ?? 0) > 60) return 'El audio debe durar como máximo 60 segundos.';
    if (m.document && m.document.mime_type !== 'application/pdf') return 'Solo se aceptan documentos PDF de hasta cinco páginas.';
    const files = [m.voice, m.audio, m.photo?.at(-1), m.document];
    if (files.some(f => f && (f.file_size ?? 0) > MAX_FILE_BYTES)) return 'Cada archivo debe pesar como máximo 10 MB.';
    return null;
  }
  private async call(method: string, body: object, effect: boolean): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetcher(`https://api.telegram.org/bot${this.config.token}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(this.config.timeout_ms ?? 15000) });
      const parsed = envelope.safeParse(await response.json());
      if (!parsed.success) throw new GroundError(effect ? 'UNCERTAIN' : 'PROVIDER_UNAVAILABLE', 'Telegram returned an unreadable response', !effect);
      if (!parsed.data.ok) throw new TelegramProviderError(parsed.data.error_code === 429 || (parsed.data.error_code ?? response.status) >= 500, parsed.data.parameters?.retry_after === undefined ? undefined : Math.min(parsed.data.parameters.retry_after * 1000, 3600000));
      return parsed.data.result;
    } catch (error) {
      if (error instanceof GroundError) throw error;
      throw new GroundError(effect ? 'UNCERTAIN' : 'PROVIDER_UNAVAILABLE', effect ? 'Telegram delivery may have occurred' : 'Telegram is unavailable', !effect);
    }
  }
  async downloadFile(file_id: string): Promise<{ bytes: Uint8Array; content_type: string; sha256: string }> {
    const metadata = z.object({ file_path: z.string().regex(/^[\w./-]+$/).refine(path => !path.split('/').includes('..')), file_size: integer.optional() }).parse(await this.call('getFile', { file_id }, false));
    if ((metadata.file_size ?? 0) > MAX_FILE_BYTES) throw new GroundError('VALIDATION_ERROR', 'File exceeds 10 MB');
    try {
      const response = await this.fetcher(`https://api.telegram.org/file/bot${this.config.token}/${metadata.file_path}`, { signal: AbortSignal.timeout(this.config.timeout_ms ?? 15000), redirect: 'error' });
      if (!response.ok || !response.body) throw new GroundError('PROVIDER_UNAVAILABLE', 'Telegram file is unavailable', true);
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
      return { bytes, content_type: response.headers.get('content-type')?.split(';')[0] ?? 'application/octet-stream', sha256: createHash('sha256').update(bytes).digest('hex') };
    } catch (error) {
      if (error instanceof GroundError) throw error;
      throw new GroundError('PROVIDER_UNAVAILABLE', 'Telegram file download failed', true);
    }
  }
  async getFile(file_id: string) { return this.downloadFile(file_id); }
  async sendMessage(input: { recipient_id: string; text: string; reply_to_message_id?: string }): Promise<ConfirmedSend> {
    if (input.text.length < 1 || input.text.length > 4096) throw new GroundError('VALIDATION_ERROR', 'Telegram text length is invalid');
    const result = z.object({ message_id: integer, date: integer, chat: z.object({ id: integer }) }).safeParse(await this.call('sendMessage', { chat_id: input.recipient_id, text: input.text, ...(input.reply_to_message_id ? { reply_parameters: { message_id: Number(input.reply_to_message_id) } } : {}), link_preview_options: { is_disabled: true } }, true));
    if (!result.success) throw new GroundError('UNCERTAIN', 'Telegram delivery confirmation is invalid');
    return { message_id: String(result.data.message_id), chat_id: String(result.data.chat.id), sent_at: new Date(result.data.date * 1000).toISOString() };
  }
  async send(input: { recipient_id: string; text: string; reply_to_message_id?: string }) { return this.sendMessage(input); }
  async answerCallback(callback_query_id: string, text: string): Promise<void> { await this.call('answerCallbackQuery', { callback_query_id, text: text.slice(0, 200) }, true); }
}
