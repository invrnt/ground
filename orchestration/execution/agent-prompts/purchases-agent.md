# Purchases agent

## Mission

Register invoice purchases and explicit receipts without creating duplicate or premature stock.

## First Read

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../README.md)
- [system-overview.md](../../architecture/system-overview.md)
- [contracts.md](../../api/contracts.md)
- [ownership.md](../ownership.md)
- [strategy.md](../../testing/strategy.md)
- Root `FEEDBACK.md`, if present; check the primary checkout through the Orchestrator for uncommitted updates.
- [product/purchases.md](../../product/purchases.md)
- [product/scenario.md](../../product/scenario.md)
- [api/endpoints.md](../../api/endpoints.md)
- [api/jobs-events.md](../../api/jobs-events.md)
- [architecture/data-state.md](../../architecture/data-state.md)
- `orchestration/execution/handoffs/site-domain.md` and the other completed handoffs from its stage. These are required when this stage starts.

## Retrieve First

Read the merged InventoryService and invoice extraction contracts first. Use D02 only if the transaction/uniqueness implementation needs clarification. No new provider or invoice extraction library is required. The source index is [docs-retrieval.md](../docs-retrieval.md).

## Own These Paths

Stage 4. All paths below are repository-relative.

- `packages/server/src/modules/purchases/`
- `apps/web/src/features/purchases/`
- `orchestration/execution/handoffs/purchases.md`
- Shared set S is read-only. Request needed edits from this stage's named S owner.

## Starting Reality Check

Stage 3 interpretation supplies invoice/receipt intents, and the site service owns inventory movements. Shared UI and session permissions already exist. Sourcing owns all Stage 4 shared registration changes. Confirm the supplied stage base and worktree before editing. Re-read optional root feedback before handoff.

## Deliver

1. Implement validated purchase recording with source evidence, exact totals and document-hash/reference duplicate detection.
2. Keep purchase and physical receipt distinct. Register the F-DEMO-001 amount while cement remains at four.
3. Implement authorized receipt confirmation through API/UI and the existing Telegram continuation contract. Atomically create receipt and one inventory movement.
4. Build compact purchase/receipt views with permitted cost visibility, status, protected document links and discrepancy guidance.
5. Export command/route registrations for sourcing. Reuse clarification and inventory services for missing data and stock effects.

## Constraints

No second invoice model call, stock store, decimal helper or new schema files. Do not treat an invoice or supplier answer as received goods. Never edit an existing purchase silently when a duplicate reference conflicts. Use a separate worktree, preserve user changes, and give the Orchestrator a complete commit for sequential integration. Delegate or request any out-of-scope edit; do not copy a helper to avoid ownership rules.

## Required Tests

Unit/integration: purchases.critical.test.ts proves 228,000 COP, stock four after purchase, and stock ten after repeated receipt with one effect. E2E: use the shared release support session; no separate full journey. Follow [minimum testing](../../testing/strategy.md); record checks without claiming unrun acceptance.

## Definition Of Done

RF10 and RF11 pass the focused persistence check. Invoice/receipt views and typed handlers are wired at Stage 4, with no premature stock change or duplicate receipt. Write the owned handoff with commit, checks, relevant feedback and unresolved items. Do not start a later stage yourself.

