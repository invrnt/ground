import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyMime, dedupKeyFor, ignoreReason, toInboundEnvelope, type SlackMessageLike } from "../src/mapping.js";

const ctx = {
  botUserId: "UBOT",
  teamId: "T1",
  maxAttachmentBytes: 10 * 1024 * 1024,
  maxAudioSeconds: 60,
  downloader: () => async () => new Uint8Array([1, 2, 3]),
  now: () => new Date("2026-09-12T15:00:00Z"),
};

const audioAndPhoto: SlackMessageLike = {
  type: "message",
  subtype: "file_share",
  ts: "1757689200.000100",
  user: "ULUIS",
  channel: "CSITE",
  text: "Terminamos de enchapar el baño 2; usamos las últimas ocho cajas del gris",
  files: [
    { id: "FAUD", name: "audio.m4a", mimetype: "audio/mp4", filetype: "m4a", size: 200_000, duration_ms: 21_000, url_private_download: "https://files.slack.com/x" },
    { id: "FIMG", name: "tuberia.jpg", mimetype: "image/jpeg", filetype: "jpg", size: 900_000, url_private_download: "https://files.slack.com/y" },
  ],
};

test("maps a file_share message with author, text and typed attachments", () => {
  const env = toInboundEnvelope(audioAndPhoto, ctx);
  assert.equal(env.channel, "slack");
  assert.equal(env.conversationId, "CSITE");
  assert.equal(env.author.externalUserId, "ULUIS");
  assert.equal(env.dedupKey, "slack:UBOT:T1:CSITE:1757689200.000100");
  assert.deepEqual(env.attachments.map((a) => a.kind), ["audio", "image"]);
  assert.equal(env.attachments[0].durationSec, 21);
  assert.equal(env.sentAt, "2025-09-12T15:00:00.000Z"); // 1757689200 as a Slack ts
  assert.equal(env.receivedAt, "2026-09-12T15:00:00.000Z");
  assert.equal(env.replyToMessageId, undefined);
});

test("a thread reply carries the parent as replyTo", () => {
  const env = toInboundEnvelope({ ...audioAndPhoto, thread_ts: "1757689100.000001" }, ctx);
  assert.equal(env.threadId, "1757689100.000001");
  assert.equal(env.replyToMessageId, "1757689100.000001");
});

test("the same delivery twice yields the same dedupKey", () => {
  const a = toInboundEnvelope(audioAndPhoto, ctx);
  const b = toInboundEnvelope(audioAndPhoto, ctx);
  assert.equal(a.dedupKey, b.dedupKey);
});

test("an edit is a new input that references the original", () => {
  const edited: SlackMessageLike = {
    type: "message",
    subtype: "message_changed",
    ts: "1757689300.000000",
    channel: "CSITE",
    message: { ...audioAndPhoto, subtype: undefined, text: "Fueron siete, no ocho", edited: { user: "ULUIS", ts: "1757689300.000000" } },
  };
  assert.equal(ignoreReason(edited, "UBOT"), null);
  const env = toInboundEnvelope(edited, ctx);
  assert.equal(env.dedupKey, "slack:UBOT:T1:CSITE:1757689200.000100:edit:1757689300.000000");
  assert.deepEqual(env.edited, { previousMessageId: "1757689200.000100" });
  assert.equal(env.text, "Fueron siete, no ocho");
});

test("oversized files and long audio are rejected with a reason, never silently", () => {
  const env = toInboundEnvelope(
    {
      ...audioAndPhoto,
      files: [
        { id: "FBIG", name: "plano.pdf", mimetype: "application/pdf", size: 11 * 1024 * 1024, url_private_download: "u" },
        { id: "FLONG", name: "nota.m4a", mimetype: "audio/mp4", size: 1000, duration_ms: 61_000, url_private_download: "u" },
        { id: "FGONE", name: "old.jpg", mimetype: "image/jpeg", size: 10, mode: "tombstone" },
      ],
    },
    ctx,
  );
  assert.equal(env.attachments.length, 0);
  assert.deepEqual(
    env.rejectedAttachments.map((r) => r.name),
    ["plano.pdf", "nota.m4a", "old.jpg"],
  );
});

test("own messages, bot messages and housekeeping subtypes are ignored", () => {
  assert.equal(ignoreReason({ ...audioAndPhoto, user: "UBOT" }, "UBOT"), "own or bot message");
  assert.equal(ignoreReason({ ...audioAndPhoto, bot_id: "B1" }, "UBOT"), "own or bot message");
  assert.equal(ignoreReason({ ...audioAndPhoto, subtype: "channel_join" }, "UBOT"), "subtype channel_join");
  assert.equal(ignoreReason({ ...audioAndPhoto, subtype: undefined }, "UBOT"), null);
});

test("mime classification covers the three PRD media types", () => {
  assert.equal(classifyMime("image/png", "png"), "image");
  assert.equal(classifyMime("audio/webm", "webm"), "audio");
  assert.equal(classifyMime(undefined, "m4a"), "audio");
  assert.equal(classifyMime("application/pdf", "pdf"), "pdf");
  assert.equal(classifyMime("application/zip", "zip"), "other");
});

test("dedup key includes bot and team so two bots in one workspace do not collide", () => {
  assert.notEqual(dedupKeyFor({ botUserId: "A", teamId: "T" }, "C", "1"), dedupKeyFor({ botUserId: "B", teamId: "T" }, "C", "1"));
});
