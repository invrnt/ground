# Ground

A construction workspace connecting Telegram reports to project records and reviewed procurement requests. Product requirements are in [PRD.md](PRD.md). The application includes authenticated project records, reviewed procurement, dispatch and admin recovery. Live provider acceptance remains pending configured accounts and credentials.

Use Node 24.21.0 and pnpm 11.24.0. Run `pnpm install`, then `pnpm check`. Copy `.env.example` to `.env` and fill in configuration locally. Scripts read process environment; load your environment through your shell or deployment launcher without printing secrets. Run `DATABASE_URL=... pnpm db:migrate` against your local database. `pnpm dev` starts the API, worker and web development processes. The Vite web server proxies `/api` to port 3000.

`pnpm demo:preflight` reports database-backed configuration and recovery state without probing providers. Admins can inspect jobs, export current or historical runs, and reset the demo from the workspace. The CLI equivalent is `pnpm demo:reset <run-id> "RESET <run-id>"`; unresolved writes must be reconciled first.

Compose defines PostgreSQL plus an API and worker with private persistent storage. Set `POSTGRES_PASSWORD`, run migrations before starting application services, and attach an existing HTTPS reverse proxy to localhost port 3000. No deployment host is configured yet. Provider secrets remain server-side.

## SDK probe

Run `pnpm probe:server`, then `pnpm --filter @ground/web exec vite ../../tools/probes --host 127.0.0.1 --port 5174`. Open `http://localhost:5174`, load the sample checkpoint, reload and load again, then confirm it. CopilotKit's `useHumanInTheLoop` response travels through the AG-UI client back to the backend. The probe saves the checkpoint atomically in ignored `.storage/probe-checkpoint.json`. It performs no external send. A previously confirmed checkpoint stays confirmed.

The probe is loopback-only and deliberately outside application registration. The application uses authenticated project events, PostgreSQL checkpoints and ApprovalService. The sample's file persistence proves reload feasibility, not production authorization or database recovery.

## Runtime setup

Provision the private volume directory with ownership for the container's `node` user. Put the API behind an HTTPS reverse proxy, set `PUBLIC_BASE_URL` to its exact origin and keep the database and private volume off the public network. Sessions use HttpOnly, SameSite=Strict cookies and Secure on HTTPS. Local development may use `http://localhost:3000`.

Set `DATABASE_URL` and a unique `DEMO_PASSWORD_ADMIN`, `DEMO_PASSWORD_LUIS`, `DEMO_PASSWORD_ANA`, `DEMO_PASSWORD_JUAN` and `DEMO_PASSWORD_PURCHASING` for the first provisioning. Each password must have at least 12 characters. The CLI only reads process environment. Run `pnpm db:migrate`, `pnpm demo:configure`, then `pnpm demo:seed`. Repeating these commands preserves the active run and stock. Reset uses the operations service and preserves retired-run audit history.

`DEMO_MANIFEST_PATH` optionally selects a private configured copy of `demo/manifest.json`. Supply real Telegram bindings, Juan's remote mapping, reviewed test recipient, product reference and media hashes there. Null entries remain visible configuration problems. Setup never claims remote access or creates provider resources.

Start the API with `pnpm --filter @ground/api dev` and the worker with `pnpm --filter @ground/worker dev`. Production uses the Dockerfile and Compose process commands. `/health/live` checks process health; `/health/ready` requires database access and a worker heartbeat within 30 seconds. Run migration and seed before starting the worker. The private files directory must be shared by API and worker.

An isolated PostgreSQL fixture is available in `packages/server/src/infra/test-database.ts`; it creates and removes a unique schema, without touching demo rows. `DATABASE_URL=... pnpm exec tsx tools/probes/runtime-check.ts` checks seed idempotence, session denial and a persisted job across reopened connections. It makes no external provider calls.

Procurement requires a stable `SESSION_SECRET` of at least 32 characters. Keep it outside Git and preserve it across restarts so pending checkpoint tokens remain recoverable. Configure the manifest's reachable Demo recipient and test address before preparing requests. Approval records an exact RFQ and a pending dispatch job; it does not create a purchase or receipt. Office synchronization is registered only when its token and workspace are configured. Ambiguous's native task field is date-only; exact Bogotá/UTC review time is retained in the managed task description.

## Release package

See [the release runbook](docs/release/runbook.md), [validation record](docs/release/validation.md) and [recording assets](docs/release/recording/README.md). The local gate passes; live provider acceptance, the 120-second recording and event submission details remain pending user configuration.
