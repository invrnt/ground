# Runtime agent

## Mission

Provide durable project storage, authenticated identities, private files and a restart-safe worker foundation.

## First Read

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../README.md)
- [system-overview.md](../../architecture/system-overview.md)
- [contracts.md](../../api/contracts.md)
- [ownership.md](../ownership.md)
- [strategy.md](../../testing/strategy.md)
- Root `FEEDBACK.md`, if present; check the primary checkout through the Orchestrator for uncommitted updates.
- [architecture/data-state.md](../../architecture/data-state.md)
- [architecture/security-performance.md](../../architecture/security-performance.md)
- [api/endpoints.md](../../api/endpoints.md)
- [api/errors.md](../../api/errors.md)
- [api/jobs-events.md](../../api/jobs-events.md)
- [product/project-setup.md](../../product/project-setup.md)
- [product/scenario.md](../../product/scenario.md)
- `orchestration/execution/handoffs/foundation.md` and the other completed handoffs from its stage. These are required when this stage starts.

## Retrieve First

D02: PostgreSQL transaction/locking and pg connection behavior. D01: the pinned Fastify cookie/session and upload APIs. Read foundation's verified configuration/provider findings; do not repeat successful probes. The source index is [docs-retrieval.md](../docs-retrieval.md).

## Own These Paths

Stage 2. All paths below are repository-relative.

- `packages/server/src/infra/`
- `packages/server/src/modules/project/`
- `scripts/configure-demo.ts`
- `scripts/seed-demo.ts`
- `demo/manifest.json`
- `demo/media/`
- `orchestration/execution/handoffs/runtime.md`
- Shared set S for Stage 2, exactly as listed in [ownership](../ownership.md). No peer may edit S during this stage.

## Starting Reality Check

Stage 1 is merged and green with frozen ports, package versions and command slots. Intake and UI peers must be implemented against these ports without importing their unmerged branches. Confirm real database and persistent storage access. Confirm the supplied stage base and worktree before editing. Re-read optional root feedback before handoff.

## Deliver

1. Implement the pg transaction runner, schema constraints for the agreed entities, project-scoped repositories, queue leasing/backoff, injected clock, outbox and worker heartbeat. No network call may run inside a SQL transaction.
2. Implement provisioned demo users, secure server sessions, password hashing, role permissions, login/logout, resource access and safe session error handling.
3. Implement bounded private media storage/download, validation and the canonical file access route. Supply one isolated database fixture for the later critical tests.
4. Create idempotent configuration and seed commands for La Arboleda, identities, material catalog, work plan and media manifest. Keep real product/user/chat values configurable, never fake a remote success.
5. As Stage 2 shared owner, finish migrations and wire the completed intake and interface exports after the Orchestrator merges them. Document HTTPS deployment, migration, seed and process start commands.

## Constraints

Own infrastructure and project configuration only. Intake semantics, worker interpretation, UI components and all domain calculations belong to other agents. Reset is a later operations use case calling your seed service. Never read or overwrite human FEEDBACK.md as configuration. Use a separate worktree, preserve user changes, and give the Orchestrator a complete commit for sequential integration. Delegate or request any out-of-scope edit; do not copy a helper to avoid ownership rules.

## Required Tests

Unit/integration: no separate broad runtime suite; verify migrate/seed twice, isolated test fixture access, session denial and one persisted job across worker restart. E2E: inspect login and health after Stage 2 integration. Run the combined stage check once. Follow [minimum testing](../../testing/strategy.md); record checks without claiming unrun acceptance.

## Definition Of Done

RF01 setup works with validated identities; storage, sessions and durable worker ports are ready. Stage 2 registers the completed peers, database constraints enforce dedupe, and the combined stage gate is green. Write the owned handoff with commit, checks, relevant feedback and unresolved items. Do not start a later stage yourself.

