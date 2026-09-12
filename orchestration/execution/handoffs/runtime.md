# Runtime handoff

Stage 1 merged commit: `3831f57`. Stage 2 infrastructure contribution is the commit containing this handoff. Peer registration and combined integration gate are pending the Orchestrator's sequential merge.

Implemented PostgreSQL transactions with checked-out client access, explicit context/run/member/material/work/inventory/file/event/job/outbox tables and intake-requested persistence tables. Queue claims use active-run locking and SKIP LOCKED; retries are bounded. Expired external-write leases remain uncertain. Intake media jobs are safe to retry. Worker heartbeat persists independently of browser state.

Provisioned accounts use salted scrypt password hashes and opaque hashed server sessions. Session endpoints enforce origin, CSRF on logout and login throttling. Project context resolves membership and active run server-side. Private downloads check project/run and restricted-document permissions. Local originals have UUID paths, private permissions, hash validation and a 20 MiB bound.

Configuration and seed are idempotent. The manifest preserves the scenario, marks all unknown remote/product/media fields pending and has no fake remote resources. The seed provides 62/19/10/9 weights, tile stock eight, cement four, hallway inputs and north-wall dependency. Later owners implement feature-specific entities and domain behavior through their migrations. No provider credentials were used.

## Checks

- Server typecheck passed before composition integration.
- Real PostgreSQL isolated schema fixture passed configure twice, seed twice, session missing/invalid-origin denial, login/session retrieval and a persisted queued job claimed through a reopened connection.
- Real database `ground_runtime` provisioned separately from `ground_foundation` on localhost:55431. `pnpm db:migrate` twice passed. `pnpm typecheck` passed across all six packages and probes.
- No broad runtime suite added. The one reusable probe covers the required runtime checks.
- Live Telegram input, real provider access, HTTPS deployment, Docker startup and media manifest acceptance remain pending user configuration. No browser verification claimed yet.

## Versions and findings

No package version upgrades. Added the already pinned Zod 3.25.76 as an explicit server dependency for manifest validation. pg 8.23.0 uses one checked-out client for an entire transaction, per official node-postgres transaction docs. PostgreSQL SELECT locking docs confirm SKIP LOCKED for queue consumers. Fastify 5.12.4 Reply headers supply session cookies and bounded binary responses; no cookie/upload plugin is necessary because cookies contain only a fixed-format opaque token and originals arrive through the bounded provider adapter.

Configuration additions: `DEMO_MANIFEST_PATH` and `DEMO_PASSWORD_ADMIN`, `DEMO_PASSWORD_LUIS`, `DEMO_PASSWORD_ANA`, `DEMO_PASSWORD_JUAN`, `DEMO_PASSWORD_PURCHASING`. No secret values recorded. README documents HTTPS, migration, configuration, seed and API/worker commands.

FEEDBACK.md absent at start; Orchestrator reported no current GitHub PR feedback. Recheck before final stage integration.
