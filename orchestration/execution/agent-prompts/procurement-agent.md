# Procurement agent

## Mission

Persist authorization for exactly one reviewed quotation-request version through CopilotKit.

## First Read

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../README.md)
- [system-overview.md](../../architecture/system-overview.md)
- [contracts.md](../../api/contracts.md)
- [ownership.md](../ownership.md)
- [strategy.md](../../testing/strategy.md)
- Root `FEEDBACK.md`, if present; check the primary checkout through the Orchestrator for uncommitted updates.
- [product/procurement.md](../../product/procurement.md)
- [product/site-state.md](../../product/site-state.md)
- [api/copilotkit.md](../../api/copilotkit.md)
- [api/jobs-events.md](../../api/jobs-events.md)
- [api/endpoints.md](../../api/endpoints.md)
- [architecture/security-performance.md](../../architecture/security-performance.md)
- `orchestration/execution/handoffs/sourcing.md` and the other completed handoffs from its stage. These are required when this stage starts.

## Retrieve First

D05 only for any unresolved callback/runtime details in the pinned SDK. Reuse the existing checkpoint port and shared contracts. Verify hashing and session handling against the merged server implementation. The source index is [docs-retrieval.md](../docs-retrieval.md).

## Own These Paths

Stage 5. All paths below are repository-relative.

- `packages/server/src/modules/procurement/`
- `apps/web/src/features/procurement/`
- `orchestration/execution/handoffs/procurement.md`
- Shared set S for Stage 5, exactly as listed in [ownership](../ownership.md). No peer may edit S during this stage.

## Starting Reality Check

Stage 4 needs/candidates/calculations and reports are merged. Stage 3 provides durable CopilotKit checkpoints. office-sync is an independent peer. Dispatch is intentionally not available until Stage 6. Confirm the supplied stage base and worktree before editing. Re-read optional root feedback before handoff.

## Deliver

1. Create immutable request proposals with material/coverage/quantity/source/cost/date/address, exact Spanish text and authorized Demo recipient.
2. Implement Change and Reject, alternative-material review, version increments and invalidation on relevant current-state changes.
3. Build ProcurementApprovalCard and wire its actual CopilotKit response to the one ApprovalService handler.
4. Validate role, session, checkpoint, expiry, run, expected versions and payload/recipient hash. Persist approval and one dispatch outbox row in the same transaction.
5. Implement the approved-but-unclaimed invalidation race rules and amendment intent after send claim. As shared owner, register the card and office-sync exports, and run the Stage 5 gate.

## Constraints

No direct Telegram send or automatic real-merchant contact. Never bind approval only to a mutable proposal ID. Do not duplicate the live SDK state or callback implementation. No optimistic Sent state while dispatch is unimplemented. Use a separate worktree, preserve user changes, and give the Orchestrator a complete commit for sequential integration. Delegate or request any out-of-scope edit; do not copy a helper to avoid ownership rules.

## Required Tests

Unit/integration: procurement.critical.test.ts covers worker/foreign sessions, expiry, stale quantity/price/recipient, repeated identical approval and one outbox. E2E: inspect Change/Reject and persisted approval across reload; final external send is tested once after Stage 6. Follow [minimum testing](../../testing/strategy.md); record checks without claiming unrun acceptance.

## Definition Of Done

RF18 is complete with exact payload authorization and race-safe invalidation. Stage 5 includes verified office resources, merged registrations and green critical checks; approved outbox is ready for dispatch. Write the owned handoff with commit, checks, relevant feedback and unresolved items. Do not start a later stage yourself.

