# Interface foundation agent

## Mission

Deliver the accessible shared UI, sign-in experience and one typed web API client.

## First Read

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../README.md)
- [system-overview.md](../../architecture/system-overview.md)
- [contracts.md](../../api/contracts.md)
- [ownership.md](../ownership.md)
- [strategy.md](../../testing/strategy.md)
- Root `FEEDBACK.md`, if present; check the primary checkout through the Orchestrator for uncommitted updates.
- [architecture/styling.md](../../architecture/styling.md)
- [architecture/i18n.md](../../architecture/i18n.md)
- [architecture/routing.md](../../architecture/routing.md)
- [design-system/tokens.md](../../design-system/tokens.md)
- [design-system/primitives.md](../../design-system/primitives.md)
- [design-system/interactions.md](../../design-system/interactions.md)
- [api/endpoints.md](../../api/endpoints.md)
- `orchestration/execution/handoffs/foundation.md` and the other completed handoffs from its stage. These are required when this stage starts.

## Retrieve First

D08 only for the pinned React APIs, semantic form/focus patterns or browser formatting behavior needed here. Use D05 findings from foundation for compatibility; do not introduce a separate SDK wrapper. The source index is [docs-retrieval.md](../docs-retrieval.md).

## Own These Paths

Stage 2. All paths below are repository-relative.

- `apps/web/src/ui/`
- `apps/web/src/styles/`
- `apps/web/src/lib/`
- `apps/web/src/features/auth/`
- `orchestration/execution/handoffs/interface-foundation.md`
- Shared set S is read-only. Request needed edits from this stage's named S owner.

## Starting Reality Check

Vite/React and registration slots are merged. Runtime session endpoints are a same-stage contract dependency. Product cards do not exist yet and must not be replaced by hardcoded demo results. Confirm the supplied stage base and worktree before editing. Re-read optional root feedback before handoff.

## Deliver

1. Implement shared tokens, Button, Card, StatusBadge, Field, Panel, links and useful loading/empty/error states as they are needed.
2. Create the login flow with expired/forbidden state and safe authenticated return path. Export it for shared route registration.
3. Provide one typed API request helper with credentials, CSRF handling and shared error mapping. Provide one display formatter for locale, project timezone, COP and exact quantity display.
4. Implement shared English UI labels, responsive shell components, visible focus, reduced-motion behavior and source-link safety.
5. Prepare the 1080p recording layout and a simple focus/zoom-friendly card area without building feature-specific cards.

## Constraints

No domain calculations, provider clients, copied global stores, feature cards or route-file edits. Feature translations stay feature-local; common copy and formatters stay in your paths. Request registration from runtime, the Stage 2 S owner. Use a separate worktree, preserve user changes, and give the Orchestrator a complete commit for sequential integration. Delegate or request any out-of-scope edit; do not copy a helper to avoid ownership rules.

## Required Tests

Unit/integration: no new tests for these reversible presentation changes. Run typecheck/build and manually inspect login, keyboard focus, one narrow width and 1080p legibility. E2E: reuse Stage 2 login check; no full product journey. Follow [minimum testing](../../testing/strategy.md); record checks without claiming unrun acceptance.

## Definition Of Done

The shared controls and client are usable by later features, sign-in has real session wiring, and one manual accessibility/layout check is recorded. Own paths only; no duplicate feature abstractions. Write the owned handoff with commit, checks, relevant feedback and unresolved items. Do not start a later stage yourself.

