# Dispatch agent

## Mission

Send the approved RFQ to its authorized demo recipient and persist its response and conditional follow-up.

## First Read

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../README.md)
- [system-overview.md](../../architecture/system-overview.md)
- [contracts.md](../../api/contracts.md)
- [ownership.md](../ownership.md)
- [strategy.md](../../testing/strategy.md)
- Root `FEEDBACK.md`, if present; check the primary checkout through the Orchestrator for uncommitted updates.
- [product/dispatch.md](../../product/dispatch.md)
- [product/procurement.md](../../product/procurement.md)
- [api/telegram.md](../../api/telegram.md)
- [api/jobs-events.md](../../api/jobs-events.md)
- [api/endpoints.md](../../api/endpoints.md)
- [architecture/security-performance.md](../../architecture/security-performance.md)
- `orchestration/execution/handoffs/procurement.md` and the other completed handoffs from its stage. These are required when this stage starts.

## Retrieve First

D03 for send result and reply semantics if the existing adapter contract leaves an uncertainty. Reuse the adapter and approved-payload contracts; do not add another Telegram SDK. The source index is [docs-retrieval.md](../docs-retrieval.md).

## Own These Paths

Stage 6. All paths below are repository-relative.

- `packages/server/src/modules/dispatch/`
- `apps/web/src/features/requests/`
- `orchestration/execution/handoffs/dispatch.md`
- Shared set S is read-only. Request needed edits from this stage's named S owner.

## Starting Reality Check

Stage 5 approval outbox and office-sync are merged and green. The Telegram adapter, report events and job runner already exist. Operations is the same-stage peer and owns shared changes. Confirm the supplied stage base and worktree before editing. Re-read optional root feedback before handoff.

## Deliver

1. Claim only current-run, approved, unchanged request payloads under the documented lock boundary; send through the existing adapter.
2. Store confirmed message ID and status, or durable uncertain/failed outcome. Implement audited reconciliation without blind automatic resend.
3. Match authorized replies by message/request ID and retain them as evidence without automatically creating purchases or receipts.
4. Persist the two-minute demo follow-up to Ana with due time, subject, run and condition. Check it again at execution and cancel resolved/reset work.
5. Build the request/reply/follow-up view and export routes/job handlers. Emit sent/reply events so the existing report and office services update the same document.

## Constraints

No proposal editing, approval bypass, mutable payload after claim, in-memory-only timer or direct messages to scraped merchants. Unknown send outcome is not retryable delivery. A post-send correction requires separately approved text. Use a separate worktree, preserve user changes, and give the Orchestrator a complete commit for sequential integration. Delegate or request any out-of-scope edit; do not copy a helper to avoid ownership rules.

## Required Tests

Unit/integration: dispatch.critical.test.ts covers uncertain send without repeated call, worker restart, resolved-condition cancellation and retired-run fencing using an injected clock. E2E: one authorized request and received message after Stage 6 integration, reused for release if unchanged. Follow [minimum testing](../../testing/strategy.md); record checks without claiming unrun acceptance.

## Definition Of Done

RF19 and RF20 are implemented with a real send record, reply association and durable follow-up. Request completion reaches reporting/office-sync through existing events and remains safe after restart/reset. Write the owned handoff with commit, checks, relevant feedback and unresolved items. Do not start a later stage yourself.

