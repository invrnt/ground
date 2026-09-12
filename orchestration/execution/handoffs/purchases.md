# Purchases handoff

Stage 4 base `92a0f1f`. Merged shared schema/migration checkpoints `272fc4a` and `2aa9d71`. Contribution commit is the commit containing this handoff. Root FEEDBACK.md is absent; Orchestrator reported no PR feedback.

Implemented invoice registration, exact line/total arithmetic through the existing domain decimal functions, scoped document-hash and normalized issuer/reference duplicate detection, receipt confirmation and cost-filtered purchase reads. A duplicate with changed invoice data returns CONFLICT for review; it never edits the original. Missing line prices return a concrete clarification error. Original evidence and optional invoice date remain attached to the recorded purchase.

Invoice registration does not touch inventory. Receipt confirmation requires the current stored member to be supervisor or admin. Purchasing access alone does not grant receipt authority. Each receipt validates purchase/line identity, remaining quantity, source identity, evidence and project version, then calls the sole InventoryReceiptService in the same transaction. Partial receipts are supported. Excess quantities need discrepancy review. Replayed source/key or a repeated completed receipt returns the existing result without another movement. Receipt, inventory effects, result and observable events commit together.

Purchase and receipt content events feed reporting's existing cursor/coalescing path. This module does not create a second report scheduling mechanism. Worker reads omit prices, totals and private invoice evidence links; supervisor/purchasing/admin reads retain permitted costs. Server events and operation diffs do not contain invoice prices.

The UI has compact invoice lines, amount visibility, protected evidence links, receipt history, partial/complete states and an explicit physical-delivery form. The form starts with blank quantities, requires confirmation of the checked delivery, and retains its idempotency key across an uncertain network retry. It does not infer receipt from the invoice.

## Bounded interpretation repair

The Orchestrator granted `packages/server/src/modules/interpretation/workflow.ts` and `resolve-extraction.ts` solely for purchase/line context resolution and photo invoice evidence. The prior interpretation owner was inactive; shared ownership records the grant. No other interpretation path was edited.

Workflow now optionally consumes `purchases.list(context, tx)` and supplies that filtered purchase context to the model. Server resolution maps a known invoice reference and a scoped material/line reference to actual purchase/line UUIDs before shared command validation. This completes the existing Telegram continuation path without another model or purchase store. Invoice hashes may come from a retained PDF or photo. Model/receipt authority is unchanged; the purchase service still enforces the receiving role.

## Integration exports

- `PurchaseService({ transactions, inventory: runtime.site })` exposes `execute(ExecutionEnvelope, tx?)` and `list(context, tx?)`.
- `purchaseModule(service, sessions)` registers GET/POST `/api/projects/:p/purchases` and POST `/api/projects/:p/purchases/:id/receipts`. Writes use session/CSRF protection, shared operation validation and the path purchase ID.
- The Stage 4 composite command service dispatches register_purchase/confirm_receipt to this service and site commands to SiteService, retaining the supplied transaction.
- Inject `purchases: purchaseService` into InterpretationWorkflow. Its existing durable clarification/reply contract handles missing data and authorized receipt continuations.
- Reporting injects `list(context, tx)` as its typed purchase supplement. The result is shared PurchaseList and already filters costs by current stored role.
- `PurchasesPanel({ projectId, csrfToken })` is the frontend feature export. Shared composition can render it alongside reporting in the existing workspace slot. It reads the server's project_version for receipt confirmation.

## Checks

- TDD critical case first failed because PurchaseService did not exist. After implementation and the merged shared version field, `TEST_DATABASE_URL=<isolated local connection> pnpm exec vitest run packages/server/src/modules/purchases/purchases.critical.test.ts` passed.
- The isolated PostgreSQL check proves COP 228000, stock four after invoice, stock ten after repeated receipts, one receipt/positive movement, unchanged duplicate invoice, conflicting invoice denial, worker cost/evidence filtering and unauthorized receipt denial. It also checks the Telegram invoice-reference/material-alias resolution against the canonical project snapshot. The fixture drops its unique schema after the check.
- Server and web typechecks passed. The required database case skips explicitly without TEST_DATABASE_URL; no fake database success is reported.
- Chrome visual inspection of a temporary synthetic preview passed: amount and invoice/receipt status were readable, Confirm receipt opened the labelled physical-delivery form, blank quantity input and explicit confirmation checkbox were present. Preview files were deleted and its server/tab closed. This was component visual inspection, not a live authenticated browser receipt journey.
- No provider call, new extraction library, broad test suite or extra live journey was added. Real invoice extraction and the shared release support session remain pending credentials/configuration. Combined stage registration/gate belongs to the shared owner.

## Versions and configuration

No dependency/version changes. Reused shared schemas, decimal.js 10.6.0 through domain functions, pg 8.23.0, TypeScript 5.9.3, React 19.3.0, Vitest 3.2.7 and the existing API client/UI/formatters. Runtime's verified PostgreSQL transaction findings apply; no new provider documentation was needed. No new configuration names or secrets.
