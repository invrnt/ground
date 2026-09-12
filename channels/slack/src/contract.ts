/**
 * Proposed shared contract between any channel adapter and the Ground core.
 *
 * This file is the adapter's view of the boundary described in PRD §08 ("Contratos")
 * and §07 (InboundMessage, Attachment, EvidenceRef). It is deliberately free of Slack
 * types so the Telegram adapter can implement the same interfaces. When the core team
 * publishes the canonical contract, this file should be replaced by an import from it.
 *
 * Rules encoded here (from the PRD):
 *  - identity comes from the channel and the server, never from message content;
 *  - the adapter never exposes provider download URLs, it hands over a fetch() instead;
 *  - a re-delivered event must map to the same dedupKey;
 *  - an edited message is a new input that references the previous one;
 *  - the adapter forwards button taps with the actor's authenticated id; the core
 *    validates action_token, version, role and expiry.
 */

export type ChannelKind = "slack" | "telegram" | "whatsapp";

export type AttachmentKind = "image" | "audio" | "pdf" | "other";

export interface InboundAttachment {
  /** Provider file id (Slack F… id). */
  externalId: string;
  kind: AttachmentKind;
  mime: string;
  name: string;
  sizeBytes: number;
  /** Present for audio clips when the provider reports it. */
  durationSec?: number;
  /** Authenticated download. The core stores the bytes in its private bucket. */
  fetch: () => Promise<Uint8Array>;
}

export interface Author {
  externalUserId: string;
  displayName?: string;
}

export interface InboundEnvelope {
  /** channel + bot + provider message id. Stable across redeliveries. */
  dedupKey: string;
  channel: ChannelKind;
  teamId: string;
  conversationId: string;
  messageId: string;
  threadId?: string;
  /** Explicit reply target when the provider gives one (Slack thread parent). */
  replyToMessageId?: string;
  author: Author;
  text: string;
  attachments: InboundAttachment[];
  /** Attachments dropped by the adapter, with the reason, so the core can tell the user. */
  rejectedAttachments: { name: string; reason: string }[];
  sentAt: string;
  receivedAt: string;
  /** Set when this envelope is an edit of an earlier message. */
  edited?: { previousMessageId: string };
}

export interface InteractionEnvelope {
  dedupKey: string;
  channel: ChannelKind;
  teamId: string;
  conversationId: string;
  /** Id of the card message the button lives on. */
  messageId: string;
  actor: Author;
  actionToken: string;
  operationId: string;
  version: number;
  choiceId: string;
  receivedAt: string;
}

export type AckStatus = "received" | "duplicate" | "ignored" | "rejected";

export interface Ack {
  status: AckStatus;
  /** Core-side InboundMessage id when status is "received". */
  inboundMessageId?: string;
  reason?: string;
}

/** What the core exposes to adapters. */
export interface CoreIngress {
  ingestMessage(envelope: InboundEnvelope): Promise<Ack>;
  ingestInteraction(envelope: InteractionEnvelope): Promise<Ack>;
}

/* ---------- Outbound: PRD card contract ---------- */

export type CardKind =
  | "entity_choice"
  | "receipt_confirmation"
  | "numeric_clarification"
  | "approval_request"
  | "status";

export interface CardField {
  label: string;
  value: string;
}

export interface CardChoice {
  id: string;
  label: string;
  style?: "primary" | "danger";
}

export interface Card {
  kind: CardKind;
  operationId: string;
  version: number;
  title: string;
  context?: string;
  fields: CardField[];
  /** At most two related decisions per card (PRD §03). */
  choices: CardChoice[];
  allowedRoles: string[];
  expiresAt?: string;
  actionToken: string;
}

export interface OutboundTarget {
  conversationId: string;
  threadId?: string;
}

export interface SentMessage {
  messageId: string;
}

/** What an adapter exposes to the core. */
export interface ChannelEgress {
  readonly channel: ChannelKind;
  sendText(target: OutboundTarget, text: string): Promise<SentMessage>;
  sendCard(target: OutboundTarget, card: Card): Promise<SentMessage>;
  /** Replace a card with its resolved state (buttons removed). */
  resolveCard(target: OutboundTarget, messageId: string, resolvedText: string): Promise<void>;
}
