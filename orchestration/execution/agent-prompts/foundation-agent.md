# Foundation agent

## Mission

Deliver a buildable workspace with frozen shared contracts and a proven CopilotKit backend round trip.

## First Read

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../README.md)
- [system-overview.md](../../architecture/system-overview.md)
- [contracts.md](../../api/contracts.md)
- [ownership.md](../ownership.md)
- [strategy.md](../../testing/strategy.md)
- Root `FEEDBACK.md`, if present; check the primary checkout through the Orchestrator for uncommitted updates.
- [architecture/decisions.md](../../architecture/decisions.md)
- [architecture/repo-structure.md](../../architecture/repo-structure.md)
- [architecture/boundaries.md](../../architecture/boundaries.md)
- [api/jobs-events.md](../../api/jobs-events.md)
- [api/copilotkit.md](../../api/copilotkit.md)
- [api/ambiguous.md](../../api/ambiguous.md)
- [execution/docs-retrieval.md](../../execution/docs-retrieval.md)

## Retrieve First

D01 and D05 in the retrieval ledger are mandatory: verify supported Node/pnpm/Vite/Fastify versions and the matched CopilotKit/AG-UI adapter. Check D02 through D07 for the bounded access probes. Record unavailable credentials and unverified account fields explicitly. The source index is [docs-retrieval.md](../docs-retrieval.md).

## Own These Paths

Stage 1. All paths below are repository-relative.

- `packages/domain/src/index.ts`
- `orchestration/execution/handoffs/foundation.md`
- Shared set S for Stage 1, exactly as listed in [ownership](../ownership.md). No peer may edit S during this stage.

## Starting Reality Check

Only PRD.md, .gitignore and the new delivery contract existed at authoring. Recheck the real checkout. Root AGENTS.md already exists and must remain at the repository root. Root FEEDBACK.md is optional. No provider access is proven by this contract. Confirm the supplied stage base and worktree before editing. Re-read optional root feedback before handoff.

## Deliver

1. Create the pnpm packages, strict TypeScript configuration, API/worker/web entrypoints, exports and module registration slots described in repo-structure. Pin actual compatible versions and create the required root commands.
2. Encode shared DTOs, errors, command names, ports and event/job types. Add the migration runner and initial schema needed by the compatibility probe. Keep other feature slots visibly unavailable.
3. Configure the single build/check workflow, environment-name example, Compose deployment shape, private storage volumes and a minimal installation README. Do not overwrite secret values.
4. Prove one actual CopilotKit state event and human callback reaching the backend, with a stored sample checkpoint surviving reload. Keep the bounded probe under tools/probes and document how production registration replaces it.
5. Run available provider capability probes once. Obtain Ambiguous's actual account schemas or name the missing access; record exact methods, IDs and read-back capability without fabricating results.

## Constraints

No product feature implementation beyond the scaffold and isolated compatibility probes. Create only the empty domain export outside S. Do not add feature folders owned by later agents. No supplier message probe without an explicitly reviewed payload and recipient. Use a separate worktree, preserve user changes, and give the Orchestrator a complete commit for sequential integration. Delegate or request any out-of-scope edit; do not copy a helper to avoid ownership rules.

## Required Tests

Unit/integration: no new application test suite. Run install, typecheck and build; exercise the migration/probe path once. E2E: one SDK event/response/reload feasibility check, not the final product journey. Record each provider probe as verified, failed or unavailable. Follow [minimum testing](../../testing/strategy.md); record checks without claiming unrun acceptance.

## Definition Of Done

A clean checkout can install and build. Shared types and registration contracts are stable. The SDK round trip is demonstrated, and provider capability blockers are explicit. Commit the scaffold and handoff; the Orchestrator merges it before Stage 2. Write the owned handoff with commit, checks, relevant feedback and unresolved items. Do not start a later stage yourself.

