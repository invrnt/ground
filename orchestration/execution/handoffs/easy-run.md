# Easy-run handoff

Base: `74e2ba3`, clean at task start. Implementation commit: `0e92f16`. Branch: `codex/ground-easy-run`. Worktree: `/home/jc/dev/hackathons/ground-worktrees/easy-run`. Integration and final GitHub feedback review are pending the Orchestrator.

## Delivered

- `pnpm run setup` checks Node and Docker access, creates `.env` only if absent with mode 0600 and generated local credentials, builds Compose images, stops existing API/worker, starts PostgreSQL, then invokes canonical `db:migrate`, `demo:configure` and `demo:seed` commands. Existing `.env` values are not overwritten; missing required names are reported. The explicit `run setup` spelling avoids ambiguity with pnpm's built-in setup command.
- `pnpm start` builds/starts the Compose services, waits for API readiness including worker heartbeat, and prints the configured login URL. The built web UI is served by the API.
- `pnpm restart` stops API and worker together before recreating them with current `.env`. It reuses built images and preserves database/private-file volumes. The internal `GROUND_COMPOSE_DATABASE_URL` child environment variable encodes the database password for the URI without persisting or logging it.
- `pnpm stop` drains API/worker before stopping PostgreSQL. None of these commands invokes reset, down or volume deletion. Repeated canonical setup preserves the active run/stock while reapplying project/member configuration.
- Compose runs Node directly with the existing tsx import hook and `init: true`, allowing signal delivery without a pnpm process wrapper. Stop grace is five minutes. Worker stops starting polls after a shutdown signal and waits for its active tick/settlement before closing its pool. API handles repeated signals once and reports shutdown failure without raw errors.
- Live SSE streams close in preClose, stop their polling timers and finish their sockets. An in-flight state lookup cannot open a new stream after shutdown starts. Ordinary requests retain graceful completion.

The focused SSE check exposed a pre-existing schema defect: `liveStateSchema` incorrectly required three top-level fields named after schemas, while `LiveService.state` returns snapshot/events/checkpoints. With the Orchestrator's added grant, removed only those incorrect fields. The check now exercises actual LiveService state generation with an isolated database double, then a real Fastify server and event stream.

Owned paths are recorded in ownership.md. Root AGENTS.md, orchestration reading order, README and the updated submission checklist were read. Previous handoffs, PRD, existing .env and submission evidence remain unchanged. FEEDBACK.md was absent at start and completion; the worktree has no .env because the real setup check stopped before file creation when Docker access failed.

## Verification

- `pnpm exec tsx --test scripts/easy-run-check.ts`: four passed. Controlled Docker executable verifies generated private configuration, preservation of existing values, canonical setup order, abort-before-seed on failure, coordinated restart and no reset/volume-removal command. A real child worker receives OS SIGTERM and records active tick settlement before pool close without another poll. A real Fastify server closes SSE while a normal active request completes. No real provider or database is involved.
- Workspace typechecks in `pnpm typecheck`: all six packages passed. The probe/script stage initially found `.ts` import suffixes in the new verification script; corrected them, then `pnpm exec tsc --noEmit -p tools/probes/tsconfig.json` passed. No unrelated checks were rerun.
- Explicit strict TypeScript check of lifecycle/check scripts passed before the suffix cleanup; the final probe/script typecheck covers the corrected imports.
- Real `docker compose config --quiet` passed using a temporary synthetic environment and copied Compose file. No resolved environment values were printed.
- Real `pnpm run setup` correctly exited with actionable Docker access guidance. Docker Compose 5.5.1 exists, but the current user cannot access `/var/run/docker.sock`. No application services or volumes were started, and no `.env` was created.
- `git diff --check`: passed.

No dependency/version updates or lockfile changes. Existing pinned Node container 24.21.0, pnpm 11.24.0, tsx 4.23.13 and Fastify 5.12.4 remain. Local checks used installed Node 26.7.0. Official docs inspected: [Compose restart](https://docs.docker.com/reference/cli/docker/compose/restart/) does not reload environment; [Compose service settings](https://docs.docker.com/reference/compose-file/services/) define init and stop grace; [Fastify preClose](https://fastify.dev/docs/v5.0.x/Reference/Hooks/) permits ending server-attached state before ordinary request drain. Installed Fastify shutdown code was also inspected.

## Limits

Docker image build, actual Compose startup, provisioning against container PostgreSQL, volume ownership and container signal delivery remain unverified due daemon access. The local process/signal checks are not Docker deployment evidence. After five minutes Docker may force termination; existing uncertain-job recovery semantics remain in effect. Normal keep-alive requests may take additional time to drain. Live providers, Telegram HTTPS reachability, eligibility, recording and final submission remain pending. Custom manifest files must be included in the image at the configured container path; private host paths are not mounted automatically. Existing initialized database passwords must be rotated separately rather than changed only in .env.
