# Sourcing agent

## Mission

Convert a persisted material need into a sourced, correctly calculated supplier comparison.

## First Read

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../README.md)
- [system-overview.md](../../architecture/system-overview.md)
- [contracts.md](../../api/contracts.md)
- [ownership.md](../ownership.md)
- [strategy.md](../../testing/strategy.md)
- Root `FEEDBACK.md`, if present; check the primary checkout through the Orchestrator for uncommitted updates.
- [product/sourcing.md](../../product/sourcing.md)
- [product/scenario.md](../../product/scenario.md)
- [api/exa.md](../../api/exa.md)
- [api/jobs-events.md](../../api/jobs-events.md)
- [architecture/data-state.md](../../architecture/data-state.md)
- [design-system/primitives.md](../../design-system/primitives.md)
- `orchestration/execution/handoffs/site-domain.md` and the other completed handoffs from its stage. These are required when this stage starts.

## Retrieve First

D06: Search and Contents request/result schemas, source fields and bounded retrieval. Reuse the pinned decimal/domain API instead of researching another calculation library. The source index is [docs-retrieval.md](../docs-retrieval.md).

## Own These Paths

Stage 4. All paths below are repository-relative.

- `packages/server/src/adapters/exa/`
- `packages/server/src/modules/sourcing/`
- `apps/web/src/features/sourcing/`
- `demo/fixtures/sourcing/`
- `orchestration/execution/handoffs/sourcing.md`
- Shared set S for Stage 4, exactly as listed in [ownership](../ownership.md). No peer may edit S during this stage.

## Starting Reality Check

Stage 3 emits committed need changes and supplies domain calculations, UI helpers and live feature slots. Purchase/report modules are independent peers. Real Exa access must be confirmed by this stage exit. Confirm the supplied stage base and worktree before editing. Re-read optional root feedback before handoff.

## Deliver

1. Implement bounded research jobs with at most two queries and five pages per query, timeout/retry states and safe public-only terms.
2. Persist source snapshots and field-level evidence; extract nullable candidate facts and compatibility classifications.
3. Call canonical domain calculations for coverage, sale-unit conversion, quantity and known cost components. Rank compatibility/date before price and preserve unresolved charges.
4. Build SupplierComparisonCard with at most three rows, expandable calculation, domain/time/excerpt/source links and finished missing-price/specification-only states.
5. Provide immutable candidate/need snapshots to later procurement. Add isolated A/B/C fixtures. As shared owner, wire merged purchase/report exports and event subscriptions, including future request events.

## Constraints

No private project fields in Exa queries, fabricated price or hardcoded live winner. No supplier contacting, approval implementation or duplicate quantity helper. Feature peers do not edit your registries or lockfile. Use a separate worktree, preserve user changes, and give the Orchestrator a complete commit for sequential integration. Delegate or request any out-of-scope edit; do not copy a helper to avoid ownership rules.

## Required Tests

Unit/integration: sourcing.critical.test.ts covers A/B/C, price per m², alternate coverage and unknown transport/tax. E2E: one real search and opened source, reused in release when still valid. Run combined Stage 4 check after wiring. Follow [minimum testing](../../testing/strategy.md); record checks without claiming unrun acceptance.

## Definition Of Done

RF17 and RF26 are implemented with attributable facts and correct quantities. The Stage 4 gate is green, real access evidence exists, and later procurement can consume the typed selection snapshot. Write the owned handoff with commit, checks, relevant feedback and unresolved items. Do not start a later stage yourself.

