/**
 * Pure functions that turn Slack payloads into contract envelopes. No I/O here, so
 * they are unit-tested with fixtures (see test/mapping.test.ts).
 */
import type { AttachmentKind, InboundAttachment, InboundEnvelope } from "./contract.js";

export interface SlackFile {
  id: string;
  name?: string;
  title?: string;
  mimetype?: string;
  filetype?: string;
  size?: number;
  url_private_download?: string;
  url_private?: string;
  /** Slack audio/video clips report duration in ms. */
  duration_ms?: number;
  mode?: string; // "tombstone" or "hidden_by_limit" when not retrievable
}

export interface SlackMessageLike {
  type: "message";
  subtype?: string;
  ts: string;
  thread_ts?: string;
  user?: string;
  bot_id?: string;
  text?: string;
  channel: string;
  team?: string;
  files?: SlackFile[];
  edited?: { user: string; ts: string };
  /** Present on message_changed events. */
  message?: SlackMessageLike & { edited?: { user: string; ts: string } };
  previous_message?: SlackMessageLike;
  client_msg_id?: string;
}

export interface MappingContext {
  botUserId: string;
  teamId: string;
  maxAttachmentBytes: number;
  maxAudioSeconds: number;
  /** Builds the authenticated downloader for a file. Injected so mapping stays pure. */
  downloader: (file: SlackFile) => () => Promise<Uint8Array>;
  now?: () => Date;
}

export function classifyMime(mime: string | undefined, filetype: string | undefined): AttachmentKind {
  const m = (mime ?? "").toLowerCase();
  const f = (filetype ?? "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("audio/") || ["m4a", "mp3", "ogg", "wav", "webm"].includes(f)) return "audio";
  if (m === "application/pdf" || f === "pdf") return "pdf";
  return "other";
}

export function dedupKeyFor(ctx: Pick<MappingContext, "botUserId" | "teamId">, channel: string, ts: string, editTs?: string): string {
  const base = `slack:${ctx.botUserId}:${ctx.teamId}:${channel}:${ts}`;
  return editTs ? `${base}:edit:${editTs}` : base;
}

export function slackTsToIso(ts: string): string {
  const seconds = Number(ts);
  if (Number.isNaN(seconds)) return new Date().toISOString();
  return new Date(seconds * 1000).toISOString();
}

/**
 * Decide whether a Slack message event is something Ground should look at.
 * Returns a reason string when it must be ignored.
 */
export function ignoreReason(msg: SlackMessageLike, botUserId: string): string | null {
  if (msg.bot_id || msg.user === botUserId) return "own or bot message";
  const st = msg.subtype;
  if (!st || st === "file_share" || st === "thread_broadcast") return null;
  if (st === "message_changed") {
    const inner = msg.message;
    if (!inner || inner.bot_id || inner.user === botUserId) return "own or bot message";
    if (!inner.edited) return "message_changed without an edit (e.g. unfurl)";
    return null;
  }
  return `subtype ${st}`;
}

/** Map a Slack message (new or edited) into the shared envelope. */
export function toInboundEnvelope(msg: SlackMessageLike, ctx: MappingContext): InboundEnvelope {
  const now = (ctx.now ?? (() => new Date()))();
  const isEdit = msg.subtype === "message_changed" && !!msg.message;
  const body = isEdit ? (msg.message as SlackMessageLike) : msg;
  const editTs = isEdit ? msg.message?.edited?.ts : undefined;

  const attachments: InboundAttachment[] = [];
  const rejected: { name: string; reason: string }[] = [];

  for (const file of body.files ?? []) {
    const name = file.name ?? file.title ?? file.id;
    if (file.mode === "tombstone" || file.mode === "hidden_by_limit") {
      rejected.push({ name, reason: "file not retrievable from Slack" });
      continue;
    }
    if (!file.url_private_download && !file.url_private) {
      rejected.push({ name, reason: "no download url (missing files:read scope?)" });
      continue;
    }
    const size = file.size ?? 0;
    if (size > ctx.maxAttachmentBytes) {
      rejected.push({ name, reason: `exceeds ${Math.round(ctx.maxAttachmentBytes / 1024 / 1024)} MB` });
      continue;
    }
    const kind = classifyMime(file.mimetype, file.filetype);
    const durationSec = file.duration_ms != null ? Math.round(file.duration_ms / 1000) : undefined;
    if (kind === "audio" && durationSec != null && durationSec > ctx.maxAudioSeconds) {
      rejected.push({ name, reason: `audio longer than ${ctx.maxAudioSeconds} s` });
      continue;
    }
    attachments.push({
      externalId: file.id,
      kind,
      mime: file.mimetype ?? "application/octet-stream",
      name,
      sizeBytes: size,
      durationSec,
      fetch: ctx.downloader(file),
    });
  }

  const threadId = body.thread_ts && body.thread_ts !== body.ts ? body.thread_ts : undefined;

  return {
    dedupKey: dedupKeyFor(ctx, msg.channel, body.ts, editTs),
    channel: "slack",
    teamId: ctx.teamId,
    conversationId: msg.channel,
    messageId: body.ts,
    threadId,
    replyToMessageId: threadId,
    author: { externalUserId: body.user ?? "unknown" },
    text: body.text ?? "",
    attachments,
    rejectedAttachments: rejected,
    sentAt: slackTsToIso(body.ts),
    receivedAt: now.toISOString(),
    edited: isEdit ? { previousMessageId: body.ts } : undefined,
  };
}
