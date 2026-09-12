/**
 * Fake core for exercising the adapter end to end in a real Slack workspace before
 * the real core exists. It does no domain logic. It proves the first-block test from
 * PRD §09: a member sends audio and a photo, Ground receives them with the right
 * author; the bot answers with two options; another member taps one; the backend
 * receives that identity; then the bot sends a request to the supplier conversation.
 *
 * Everything it says is prefixed with [demo-core] so nobody mistakes it for the product.
 */
import type { Ack, Card, ChannelEgress, CoreIngress, InboundEnvelope, InteractionEnvelope } from "./contract.js";

export class FakeCore implements CoreIngress {
  private egress: ChannelEgress | null = null;
  private readonly seen = new Set<string>();
  private readonly pending = new Map<string, { card: Card; messageId: string; conversationId: string }>();
  private seq = 0;

  constructor(private readonly supplierChannel: string | null) {}

  attach(egress: ChannelEgress): void {
    this.egress = egress;
  }

  async ingestMessage(env: InboundEnvelope): Promise<Ack> {
    if (this.seen.has(env.dedupKey)) return { status: "duplicate" };
    this.seen.add(env.dedupKey);

    const files = await Promise.all(
      env.attachments.map(async (a) => {
        const bytes = await a.fetch();
        return `${a.kind} ${a.name} (${bytes.byteLength} bytes${a.durationSec ? `, ${a.durationSec}s` : ""})`;
      }),
    );
    console.log("[demo-core] inbound", {
      dedupKey: env.dedupKey,
      author: env.author.externalUserId,
      text: env.text,
      files,
      rejected: env.rejectedAttachments,
      replyTo: env.replyToMessageId,
      edited: env.edited,
    });

    if (!this.egress) return { status: "received", inboundMessageId: env.dedupKey };

    const id = `op_${++this.seq}`;
    const card: Card = {
      kind: "receipt_confirmation",
      operationId: id,
      version: 1,
      title: "[demo-core] ¿Ya llegaron a obra?",
      context: `Recibí de <@${env.author.externalUserId}>: "${env.text || "(sin texto)"}"` +
        (files.length ? `\nAdjuntos: ${files.join("; ")}` : "") +
        (env.rejectedAttachments.length
          ? `\nNo pude usar: ${env.rejectedAttachments.map((r) => `${r.name} (${r.reason})`).join("; ")}`
          : ""),
      fields: [
        { label: "Material", value: "CEM-50 · bulto 50 kg" },
        { label: "Cantidad", value: "6" },
      ],
      choices: [
        { id: "yes", label: "Sí, ya llegaron", style: "primary" },
        { id: "no", label: "Todavía no" },
      ],
      allowedRoles: ["operario", "supervisor"],
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      actionToken: `tok_${id}_${Math.random().toString(36).slice(2, 10)}`,
    };
    const target = { conversationId: env.conversationId, threadId: env.threadId ?? env.messageId };
    const sent = await this.egress.sendCard(target, card);
    this.pending.set(id, { card, messageId: sent.messageId, conversationId: env.conversationId });
    return { status: "received", inboundMessageId: env.dedupKey };
  }

  async ingestInteraction(env: InteractionEnvelope): Promise<Ack> {
    console.log("[demo-core] interaction", {
      actor: env.actor.externalUserId,
      operationId: env.operationId,
      version: env.version,
      choice: env.choiceId,
    });
    const p = this.pending.get(env.operationId);
    if (!p) return { status: "rejected", reason: "[demo-core] Esta solicitud ya fue resuelta o venció." };
    if (p.card.actionToken !== env.actionToken || p.card.version !== env.version) {
      return { status: "rejected", reason: "[demo-core] Versión obsoleta; se generó una nueva tarjeta." };
    }
    this.pending.delete(env.operationId);

    if (this.egress) {
      const text = env.choiceId === "yes"
        ? `[demo-core] Aplicado · recepción registrada por <@${env.actor.externalUserId}> · cemento 4 → 10`
        : `[demo-core] Pendiente · recepción sigue sin confirmar (respondió <@${env.actor.externalUserId}>)`;
      await this.egress.resolveCard({ conversationId: p.conversationId }, p.messageId, text);

      if (env.choiceId === "yes" && this.supplierChannel) {
        const sent = await this.egress.sendText(
          { conversationId: this.supplierChannel },
          "[demo-core · datos de prueba] Solicitud de cotización: 20 cajas POR-GRIS-60, entrega mañana, obra La Arboleda. Responder en este canal.",
        );
        console.log("[demo-core] supplier request sent", sent);
      }
    }
    return { status: "received" };
  }
}
