# Exclusive path ownership

All paths are repository-relative. A directory entry includes its descendants. Except for the explicit transfers below, a feature's paths remain read-only after its stage. Request repairs through that owner or the final release transfer; no opportunistic cross-feature edits.

## Shared set S

Exactly one implementation agent owns S in each stage:

- Root `AGENTS.md`, `README.md`, `.gitignore`, `.env.example`, `.node-version`, `.dockerignore`, `Dockerfile`, `compose.yaml`, `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.base.json`, `vitest.config.ts`, and `.github/workflows/`.
- Workspace `package.json` and `tsconfig.json` files; `apps/web/vite.config.ts` and `apps/web/index.html`.
- `packages/contracts/`, `packages/server/migrations/`, `packages/server/src/index.ts`, `packages/server/src/composition.ts`.
- `apps/api/src/main.ts`, `apps/api/src/register.ts`, `apps/worker/src/main.ts`, `apps/worker/src/register.ts`.
- `apps/web/src/main.tsx`, `apps/web/src/app.tsx`, `apps/web/src/routes.tsx`, `apps/web/src/feature-registry.ts`.
- `scripts/migrate.ts`, `scripts/preflight.ts`, and `tools/probes/`.
- `orchestration/`, excluding each agent's individual handoff described below.

Root `FEEDBACK.md`, `.env` values and any other secret files are outside all edit grants. Human feedback remains human-owned. `.env.example` contains names and nonsecret examples only.

## Stage grants

| Stage | Agent | Exclusive feature paths | Shared set S |
| --- | --- | --- | --- |
| 1 | foundation | `packages/domain/src/index.ts` as an empty initial export only | Yes |
| 2 | runtime | `packages/server/src/infra/`, `packages/server/src/modules/project/`, `scripts/configure-demo.ts`, `scripts/seed-demo.ts`, `demo/manifest.json`, `demo/media/` | Yes |
| 2 | telegram-intake | `packages/server/src/adapters/telegram/`, `packages/server/src/modules/ingestion/` | No |
| 2 | interface-foundation | `apps/web/src/ui/`, `apps/web/src/styles/`, `apps/web/src/lib/`, `apps/web/src/features/auth/` | No |
| 3 | site-domain | `packages/domain/src/`, `packages/server/src/modules/site/` | Yes |
| 3 | interpretation | `packages/server/src/adapters/openai/`, `packages/server/src/modules/interpretation/` | No |
| 3 | live-workspace | `packages/server/src/modules/live/`, `apps/web/src/copilot/`, `apps/web/src/features/workspace/`, `apps/web/src/features/evidence/` | No |
| 4 | sourcing | `packages/server/src/adapters/exa/`, `packages/server/src/modules/sourcing/`, `apps/web/src/features/sourcing/`, `demo/fixtures/sourcing/` | Yes |
| 4 | purchases | `packages/server/src/modules/purchases/`, `apps/web/src/features/purchases/` | No |
| 4 | reporting | `packages/server/src/modules/reporting/`, `apps/web/src/features/reports/` | No |
| 5 | procurement | `packages/server/src/modules/procurement/`, `apps/web/src/features/procurement/` | Yes |
| 5 | office-sync | `packages/server/src/adapters/ambiguous/`, `packages/server/src/modules/workspace-sync/` | No |
| 6 | operations | `packages/server/src/modules/operations/`, `apps/web/src/features/operations/`, `scripts/reset-demo.ts` | Yes |
| 6 | dispatch | `packages/server/src/modules/dispatch/`, `apps/web/src/features/requests/` | No |
| 7 | release-readiness | All implemented application paths above, `tests/release/`, `docs/release/`; prior owners inactive | Yes |

Each implementation agent additionally owns only `orchestration/execution/handoffs/<agent-name>.md`. Those individual files are excluded from S. An agent records its own findings there rather than editing shared contracts. The release agent may read all handoffs but does not rewrite other agents' evidence.

The Orchestrator owns no implementation paths. It can inspect all files and perform git integration operations. It delegates implementation, tests, registration edits, documentation updates and code conflict fixes to the granted implementation owner.

## Transfers and coordination

1. S transfers in order: foundation, runtime, site-domain, sourcing, procurement, operations, release-readiness. Transfer occurs only after the prior stage is merged and green.
2. The initial domain export transfers from foundation to site-domain in Stage 3. No other feature file is preemptively created by foundation.
3. During a parallel stage, contracts are frozen. A necessary shared change goes to the S owner. For a breaking change, pause peers, commit and merge the contract change, then rebase every peer before continuing. Record this sequential checkpoint.
4. Module owners deliver exports. After peer commits are ready, the S owner updates registries in its worktree using the merged stage baseline. The Orchestrator merges that integration commit and checks the stage gate. No two agents edit a registry.
5. An out-of-stage feature repair requires a named temporary grant listing exact paths and suspending any overlapping owner. The Orchestrator delegates it to the original owner in a new worktree. S remains with the current S owner unless explicitly transferred.
6. Stage 7 transfers application repair ownership to release-readiness after all earlier agents are done. If PR feedback later needs a feature specialist, pause the release owner for those exact paths and use a sequential repair grant.

Do not add an unowned file silently. The S owner assigns it in this table and the affected prompt before work begins. Use the existing feature directory when possible. Changes to documentation never automatically authorize changes outside the user's product scope.

Stage 3 temporary grant from the Orchestrator: site-domain may edit `packages/server/src/modules/project/repository.ts` solely to extend the canonical snapshot with site entities, aliases and computed progress. The prior runtime owner is inactive for this path. No second snapshot implementation is authorized.
