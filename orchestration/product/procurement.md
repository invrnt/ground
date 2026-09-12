# Procurement decision

Owner: `procurement`. Requirement: RF18.

Prepare a versioned quotation request from a current need, selected candidate or required specification. ProcurementApprovalCard shows reference, material, coverage, recalculated boxes, source, published price, subtotal, unresolved charges/availability/lot, desired date, test delivery address, full outgoing text and authorized destination labeled `Demo recipient`.

The exact outgoing template is:

```text
Solicitud de cotización · La Arboleda · DEMO
Material: {verified brand and commercial reference, or required specification}
Cantidad: {boxes calculated for that coverage}
Destino: {authorized test address}
Fecha solicitada: {absolute scenario date}
Referencia pública: {URL if available; otherwise pending}
Precio publicado: {value and unit if available; otherwise to confirm}
Confirmar disponibilidad, lote/tono, transporte, total y fecha de entrega.
Solicitud: {request_id}
```

The controls are `Approve & send request`, `Change` and `Reject`. Change permits material/candidate, quantity, desired date and authorized destination edits within server rules. Recalculate and create a new version; never mutate a signed version. Review an alternative shade explicitly. Reject closes the proposal and preserves research. Changing relevant facts invalidates approval.

The CopilotKit callback carries proposal ID, version, decision and checkpoint token. The backend derives Ana's identity and checks supervisor permission, project, active run, expiry, current need/candidate version and immutable payload hash. Persist approval and dispatch outbox atomically. A repeated identical approval returns its existing result. Conflicting or stale approvals cannot send.

The UI resumes only after the backend records the decision. Show persistent pending state after reload and the eventual request result supplied by dispatch. Worker and purchasing-only accounts cannot approve. A link, old token or frontend state change is not authorization.

Dispatch is an RFQ, not a purchase order, payment or committed receipt. Real merchant names stay on sources while all messages go to the separately authorized demo conversation.
