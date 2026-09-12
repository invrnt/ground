/**
 * HTTP client for the core ingress. Proposed endpoints (to agree with the core team):
 *
 *   POST {CORE_URL}/channel/inbound        multipart/form-data
 *        field "envelope": JSON of InboundEnvelope minus the fetch functions
 *        field "file:<externalId>": one part per attachment, bytes
 *   POST {CORE_URL}/channel/interaction    application/json  InteractionEnvelope
 *
 * Both carry header `x-ground-channel-secret`. Both answer an Ack JSON.
 * The adapter downloads the media before calling the core so the core never sees a
 * Slack URL or the bot token.
 */
import type { Ack, CoreIngress, InboundEnvelope, InteractionEnvelope } from "./contract.js";

export class HttpCore implements CoreIngress {
  constructor(private readonly baseUrl: string, private readonly secret: string) {}

  async ingestMessage(envelope: InboundEnvelope): Promise<Ack> {
    const { attachments, ...rest } = envelope;
    const form = new FormData();
    form.set(
      "envelope",
      JSON.stringify({
        ...rest,
        attachments: attachments.map(({ fetch: _f, ...meta }) => meta),
      }),
    );
    for (const att of attachments) {
      const bytes = await att.fetch();
      // Uint8Array may sit on a SharedArrayBuffer in the type system; copy to a plain ArrayBuffer.
      const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      form.set(`file:${att.externalId}`, new Blob([buf], { type: att.mime }), att.name);
    }
    const res = await fetch(`${this.baseUrl}/channel/inbound`, {
      method: "POST",
      headers: { "x-ground-channel-secret": this.secret },
      body: form,
    });
    return this.toAck(res);
  }

  async ingestInteraction(envelope: InteractionEnvelope): Promise<Ack> {
    const res = await fetch(`${this.baseUrl}/channel/interaction`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-ground-channel-secret": this.secret },
      body: JSON.stringify(envelope),
    });
    return this.toAck(res);
  }

  private async toAck(res: Response): Promise<Ack> {
    if (res.status === 409) return { status: "duplicate" };
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`core responded ${res.status}: ${text.slice(0, 200)}`);
    }
    return (await res.json()) as Ack;
  }
}
