import bolt from "@slack/bolt";
import type { App as BoltApp } from "@slack/bolt";
import type {
  Card,
  ChannelEgress,
  CoreIngress,
  InteractionEnvelope,
  OutboundTarget,
  SentMessage,
} from "./contract.js";
import type { SlackAdapterConfig } from "./config.js";
import { RecentKeys } from "./dedup.js";
import { CHOICE_ACTION_ID, cardFallbackText, cardToBlocks, decodeChoice, resolvedBlocks } from "./blocks.js";
import { ignoreReason, toInboundEnvelope, type SlackFile, type SlackMessageLike } from "./mapping.js";

const { App, LogLevel } = bolt;

export interface SlackAdapter {
  egress: ChannelEgress;
  start(): Promise<void>;
  stop(): Promise<void>;
}

const LEVELS: Record<SlackAdapterConfig["logLevel"], bolt.LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

export function createSlackAdapter(cfg: SlackAdapterConfig, core: CoreIngress): SlackAdapter {
  const app: BoltApp = new App({
    token: cfg.botToken,
    signingSecret: cfg.signingSecret,
    appToken: cfg.appToken,
    socketMode: true,
    logLevel: LEVELS[cfg.logLevel],
  });

  const recent = new RecentKeys();
  let botUserId = "";
  let teamId = "";

  const log = app.logger;

  function isAuthorizedConversation(channel: string): boolean {
    return cfg.allowedChannels.has(channel);
  }

  function isAuthorizedUser(user: string | undefined): boolean {
    if (!user) return false;
    return cfg.allowedUsers ? cfg.allowedUsers.has(user) : true;
  }

  function isAllowedOutbound(channel: string): boolean {
    return cfg.allowedChannels.has(channel) || channel === cfg.supplierChannel;
  }

  /** Authenticated download. The URL carries no secret, the bearer header does. */
  function downloader(file: SlackFile): () => Promise<Uint8Array> {
    const url = file.url_private_download ?? file.url_private!;
    return async () => {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${cfg.botToken}` } });
      if (!res.ok) throw new Error(`Slack file download failed: ${res.status} for ${file.id}`);
      const ct = res.headers.get("content-type") ?? "";
      if (ct.startsWith("text/html")) {
        throw new Error(`Slack returned HTML instead of the file ${file.id}; check files:read scope`);
      }
      return new Uint8Array(await res.arrayBuffer());
    };
  }

  /* ---------- inbound messages ---------- */

  app.event("message", async ({ event }) => {
    const msg = event as unknown as SlackMessageLike;
    if (!isAuthorizedConversation(msg.channel)) {
      log.debug(`ignore message in unauthorized conversation ${msg.channel}`);
      return;
    }
    const reason = ignoreReason(msg, botUserId);
    if (reason) {
      log.debug(`ignore ${msg.channel}/${msg.ts}: ${reason}`);
      return;
    }
    const envelope = toInboundEnvelope(msg, {
      botUserId,
      teamId,
      maxAttachmentBytes: cfg.maxAttachmentBytes,
      maxAudioSeconds: cfg.maxAudioSeconds,
      downloader,
    });
    if (!isAuthorizedUser(envelope.author.externalUserId)) {
      log.warn(`ignore message from unauthorized user ${envelope.author.externalUserId} in ${msg.channel}`);
      return;
    }
    if (recent.check(envelope.dedupKey)) {
      log.info(`duplicate delivery ${envelope.dedupKey}, skipped locally`);
      return;
    }
    try {
      const ack = await core.ingestMessage(envelope);
      log.info(`inbound ${envelope.dedupKey} → ${ack.status}${ack.reason ? ` (${ack.reason})` : ""}`);
    } catch (err) {
      // Bolt already acked Slack; the core call is the durable step. Surface it loudly.
      log.error(`core.ingestMessage failed for ${envelope.dedupKey}: ${(err as Error).message}`);
      throw err;
    }
  });

  /* ---------- button taps ---------- */

  app.action(new RegExp(`^${CHOICE_ACTION_ID}:`), async ({ ack, body, action, respond }) => {
    await ack();
    if (body.type !== "block_actions" || action.type !== "button") return;
    const channel = body.channel?.id;
    const messageId = body.message?.ts;
    if (!channel || !messageId || !isAuthorizedConversation(channel)) {
      log.warn(`interaction from unauthorized or unknown conversation ${channel}`);
      return;
    }
    const choice = decodeChoice(action.value ?? "");
    if (!choice) {
      log.warn(`undecodable choice value on ${channel}/${messageId}`);
      await respond({ text: "Este botón ya no es válido.", replace_original: false, response_type: "ephemeral" });
      return;
    }
    const envelope: InteractionEnvelope = {
      dedupKey: `slack:${botUserId}:${teamId}:${channel}:${messageId}:${choice.o}:${choice.v}:${choice.c}:${body.user.id}:${body.trigger_id}`,
      channel: "slack",
      teamId,
      conversationId: channel,
      messageId,
      actor: { externalUserId: body.user.id, displayName: body.user.name ?? body.user.username },
      actionToken: choice.t,
      operationId: choice.o,
      version: choice.v,
      choiceId: choice.c,
      receivedAt: new Date().toISOString(),
    };
    const result = await core.ingestInteraction(envelope);
    log.info(`interaction ${envelope.operationId} v${envelope.version} ${envelope.choiceId} by ${body.user.id} → ${result.status}`);
    if (result.status === "rejected") {
      // Only the tapping user sees this; the card itself is updated by the core via egress.
      await respond({
        text: result.reason ?? "No autorizado o solicitud vencida.",
        replace_original: false,
        response_type: "ephemeral",
      });
    }
  });

  /* ---------- outbound ---------- */

  function guardTarget(target: OutboundTarget): void {
    if (!isAllowedOutbound(target.conversationId)) {
      throw new Error(`Refusing to send to conversation ${target.conversationId}: not in allowlist`);
    }
  }

  const egress: ChannelEgress = {
    channel: "slack",
    async sendText(target, text): Promise<SentMessage> {
      guardTarget(target);
      const res = await app.client.chat.postMessage({
        channel: target.conversationId,
        thread_ts: target.threadId,
        text,
      });
      return { messageId: res.ts! };
    },
    async sendCard(target, card: Card): Promise<SentMessage> {
      guardTarget(target);
      const res = await app.client.chat.postMessage({
        channel: target.conversationId,
        thread_ts: target.threadId,
        text: cardFallbackText(card),
        blocks: cardToBlocks(card) as never,
      });
      return { messageId: res.ts! };
    },
    async resolveCard(target, messageId, resolvedText): Promise<void> {
      guardTarget(target);
      await app.client.chat.update({
        channel: target.conversationId,
        ts: messageId,
        text: resolvedText,
        blocks: resolvedBlocks(resolvedText) as never,
      });
    },
  };

  return {
    egress,
    async start() {
      const auth = await app.client.auth.test();
      botUserId = auth.user_id as string;
      teamId = auth.team_id as string;
      await app.start();
      log.info(`Slack adapter connected as ${auth.user} (${botUserId}) in team ${teamId}; listening on ${[...cfg.allowedChannels].join(", ")}`);
    },
    async stop() {
      await app.stop();
    },
  };
}
