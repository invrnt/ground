# Site domain agent

## Mission

Apply deterministic construction operations with correct progress, inventory, dependencies and compensating corrections.

## First Read

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../README.md)
- [system-overview.md](../../architecture/system-overview.md)
- [contracts.md](../../api/contracts.md)
- [ownership.md](../ownership.md)
- [strategy.md](../../testing/strategy.md)
- Root `FEEDBACK.md`, if present; check the primary checkout through the Orchestrator for uncommitted updates.
- [product/site-state.md](../../product/site-state.md)
- [product/scenario.md](../../product/scenario.md)
- [architecture/data-state.md](../../architecture/data-state.md)
- [architecture/boundaries.md](../../architecture/boundaries.md)
- [api/jobs-events.md](../../api/jobs-events.md)
- [api/endpoints.md](../../api/endpoints.md)
- `orchestration/execution/handoffs/runtime.md` and the other completed handoffs from its stage. These are required when this stage starts.

## Retrieve First

D02 for version locks and transactions. Verify the pinned exact-decimal utility if one was selected. No model or supplier research is needed for domain arithmetic. The source index is [docs-retrieval.md](../docs-retrieval.md).

## Own These Paths

Stage 3. All paths below are repository-relative.

- `packages/domain/src/`
- `packages/server/src/modules/site/`
- `orchestration/execution/handoffs/site-domain.md`
- Shared set S for Stage 3, exactly as listed in [ownership](../ownership.md). No peer may edit S during this stage.

## Starting Reality Check

Stage 2 runtime, Telegram intake and shared UI are merged and green. The domain export transfers to you. Interpretation and live-workspace are same-stage peers consuming the frozen command/result contracts. Confirm the supplied stage base and worktree before editing. Re-read optional root feedback before handoff.

## Deliver

1. Implement the sole quantity/money calculations and construction invariants: weighted 81% progress, stock ledger, 20-box need and compatible unit conversions.
2. Implement versioned transactional site commands, operation dedupe, insufficient-stock handling, issue/assignment changes and task blocking dependencies with evidence.
3. Add append-only correction support, including stock +1 and need 19. Emit proposal invalidation/amendment intent through the agreed event/port contract; do not implement another approval service.
4. Expose the authorized site operation/correction routes and InventoryService for later purchases. Preserve independent operation results.
5. As shared owner, wire merged interpretation and live modules, replace the foundation SDK probe registration and verify the real report-to-state path. Register later command types as explicitly unavailable until their owner merges.

## Constraints

Pure domain files cannot import SQL, UI or provider SDKs. Do not edit interpreter/live-owned code. Do not compute values in prompts or frontend components. Changes before a send claim must invalidate authorization; changes after claim preserve the original and require an amendment. Use a separate worktree, preserve user changes, and give the Orchestrator a complete commit for sequential integration. Delegate or request any out-of-scope edit; do not copy a helper to avoid ownership rules.

## Required Tests

Unit/integration: site.critical.test.ts covers scenario arithmetic, repeated milestone, overspend, two concurrent consumptions and correction. Use one isolated DB fixture. E2E: observe the integrated audio/photo state path once at the Stage 3 gate, reusing it for later evidence. Follow [minimum testing](../../testing/strategy.md); record checks without claiming unrun acceptance.

## Definition Of Done

RF07, RF09, RF12, RF13, RF14 and RF23 are implemented. Domain invariants and the merged Stage 3 build pass; events only show applied state after commit. Write the owned handoff with commit, checks, relevant feedback and unresolved items. Do not start a later stage yourself.

