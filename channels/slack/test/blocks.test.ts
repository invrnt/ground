import { test } from "node:test";
import assert from "node:assert/strict";
import { cardToBlocks, decodeChoice, encodeChoice, resolvedBlocks } from "../src/blocks.js";
import type { Card } from "../src/contract.js";

const approval: Card = {
  kind: "approval_request",
  operationId: "op_42",
  version: 3,
  title: "Aprobar solicitud de porcelanato",
  context: "20 cajas POR-GRIS-60 · Proveedor A · entrega declarada mañana",
  fields: [
    { label: "Importe", value: "$1.130.000 COP" },
    { label: "Destino", value: "Obra La Arboleda <pasillo>" },
  ],
  choices: [
    { id: "approve", label: "Aprobar", style: "primary" },
    { id: "reject", label: "Rechazar", style: "danger" },
  ],
  allowedRoles: ["supervisor"],
  expiresAt: "2026-09-12T20:00:00Z",
  actionToken: "tok_abc",
};

test("renders header, context, fields and two buttons whose values round-trip", () => {
  const blocks = cardToBlocks(approval);
  const types = blocks.map((b) => b.type);
  assert.deepEqual(types, ["header", "context", "section", "section", "actions", "context"]);

  const actions = blocks[4] as { elements: { action_id: string; value: string; style?: string }[] };
  assert.equal(actions.elements.length, 2);
  assert.equal(actions.elements[0].action_id, "ground:choice:approve");
  assert.equal(actions.elements[1].style, "danger");

  const decoded = decodeChoice(actions.elements[0].value);
  assert.deepEqual(decoded, { t: "tok_abc", o: "op_42", v: 3, c: "approve" });
});

test("field values are escaped for mrkdwn", () => {
  const blocks = cardToBlocks(approval);
  const section = blocks[3] as { fields: { text: string }[] };
  assert.match(section.fields[1].text, /&lt;pasillo&gt;/);
});

test("more than two choices is a contract violation", () => {
  assert.throws(() => cardToBlocks({ ...approval, choices: [...approval.choices, { id: "x", label: "Otra" }] }));
});

test("decodeChoice rejects garbage", () => {
  assert.equal(decodeChoice("not json"), null);
  assert.equal(decodeChoice(JSON.stringify({ t: "a" })), null);
});

test("encodeChoice guards Slack's value limit", () => {
  assert.throws(() => encodeChoice({ ...approval, actionToken: "x".repeat(2100) }, "approve"));
});

test("a resolved card has no actions block", () => {
  const blocks = resolvedBlocks("Aplicado · cemento 4 → 10");
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, "section");
});
