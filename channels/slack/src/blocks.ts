import type { Card } from "./contract.js";

/** Single action_id for every Ground button so one handler covers all card kinds. */
export const CHOICE_ACTION_ID = "ground:choice";

export interface ChoiceValue {
  t: string; // actionToken
  o: string; // operationId
  v: number; // version
  c: string; // choiceId
}

/** Slack caps button `value` at 2000 chars; the token is opaque so keep it short. */
export function encodeChoice(card: Card, choiceId: string): string {
  const value: ChoiceValue = {
    t: card.actionToken,
    o: card.operationId,
    v: card.version,
    c: choiceId,
  };
  const s = JSON.stringify(value);
  if (s.length > 2000) throw new Error("Choice value exceeds Slack's 2000 char limit");
  return s;
}

export function decodeChoice(value: string): ChoiceValue | null {
  try {
    const parsed = JSON.parse(value) as Partial<ChoiceValue>;
    if (
      typeof parsed.t !== "string" ||
      typeof parsed.o !== "string" ||
      typeof parsed.v !== "number" ||
      typeof parsed.c !== "string"
    ) {
      return null;
    }
    return parsed as ChoiceValue;
  } catch {
    return null;
  }
}

type Block = Record<string, unknown>;

const KIND_LABEL: Record<Card["kind"], string> = {
  entity_choice: "Necesita respuesta",
  receipt_confirmation: "Necesita respuesta",
  numeric_clarification: "Necesita respuesta",
  approval_request: "Requiere aprobación",
  status: "Estado",
};

/**
 * Render a Ground card as Block Kit. The model never produces these blocks; the
 * adapter builds them from the typed card, so nothing model-generated is executed.
 */
export function cardToBlocks(card: Card): Block[] {
  if (card.choices.length > 2) {
    throw new Error(`Card ${card.operationId} has ${card.choices.length} choices; PRD allows at most 2`);
  }
  const blocks: Block[] = [
    {
      type: "header",
      text: { type: "plain_text", text: truncate(card.title, 150), emoji: false },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `*${KIND_LABEL[card.kind]}* · op \`${card.operationId}\` v${card.version}` +
            (card.expiresAt ? ` · vence ${formatExpiry(card.expiresAt)}` : ""),
        },
      ],
    },
  ];

  if (card.context) {
    blocks.push({ type: "section", text: { type: "mrkdwn", text: truncate(card.context, 3000) } });
  }

  if (card.fields.length) {
    // Slack allows up to 10 fields per section.
    for (let i = 0; i < card.fields.length; i += 10) {
      blocks.push({
        type: "section",
        fields: card.fields.slice(i, i + 10).map((f) => ({
          type: "mrkdwn",
          text: `*${escape(f.label)}*\n${escape(f.value)}`,
        })),
      });
    }
  }

  if (card.choices.length) {
    blocks.push({
      type: "actions",
      block_id: `ground:${card.operationId}:${card.version}`,
      elements: card.choices.map((choice) => ({
        type: "button",
        action_id: `${CHOICE_ACTION_ID}:${choice.id}`,
        text: { type: "plain_text", text: truncate(choice.label, 75), emoji: false },
        value: encodeChoice(card, choice.id),
        ...(choice.style ? { style: choice.style } : {}),
      })),
    });
  }

  if (card.allowedRoles.length) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: `Solo puede responder: ${card.allowedRoles.join(", ")}` }],
    });
  }

  return blocks;
}

/** Replace a card's blocks once the core resolved it: no buttons remain. */
export function resolvedBlocks(text: string): Block[] {
  return [{ type: "section", text: { type: "mrkdwn", text: truncate(text, 3000) } }];
}

/** Plain-text fallback Slack shows in notifications. */
export function cardFallbackText(card: Card): string {
  return `${KIND_LABEL[card.kind]}: ${card.title}`;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // Slack renders in the viewer's timezone from the epoch; see date formatting in mrkdwn.
  return `<!date^${Math.floor(d.getTime() / 1000)}^{date_short} {time}|${iso}>`;
}
