# Ground

A construction workspace connecting Telegram reports to project records and reviewed procurement requests. Product requirements are in [PRD.md](PRD.md). The application includes authenticated project records, reviewed procurement, dispatch and admin recovery. Live provider acceptance remains pending configured accounts and credentials.

## Run locally

Install Node 24.21.0, pnpm 11.24.0 and Docker Engine/Desktop with Compose. Docker must be running and accessible to your user. From the repository root:

```sh
pnpm run setup
pnpm start
```

Use `pnpm run setup` explicitly to select this project's setup script rather than pnpm's own setup command. Setup builds the existing Compose images, starts PostgreSQL, and runs the canonical migration, configuration and seed commands. If `.env` does not exist, it creates a private file with generated local passwords and a session secret. Existing `.env` values are never changed; missing required names are reported. Read `DEMO_PASSWORD_ADMIN` in that file locally to sign in as `admin`. Provider keys may be added later; local startup does not verify their access.

`pnpm start` builds and starts the web/API, worker and database, waits for API/worker health, then prints the login URL. The default is `http://localhost:3000/login`. The web UI is served by the API container, so a separate Vite process is unnecessary. For a different local port, change both `PORT` and `PUBLIC_BASE_URL` in `.env`.

```sh
pnpm restart  # Apply .env changes to API and worker together
pnpm stop     # Stop services and preserve database/private files
```

Restart stops both application services before recreating them with the current environment. Active worker work can finish before its database pool closes; open event streams close on API shutdown. Docker allows up to five minutes before forcing termination. Database and private-file volumes are preserved. No command resets the demo or removes volumes. Run setup again after schema changes; it preserves the active scenario and stock, but reapplies configured project/member settings. Setup stops API and worker before migrations. Do not change `POSTGRES_PASSWORD` on an already initialized database without separately rotating the database password.

Set `AI_PROVIDER=openrouter` or `AI_PROVIDER=vercel` in `.env`, configure that provider's key and separate transcription/interpretation models, then run `pnpm restart`. OpenRouter remains the default. Vercel transcription is beta and requires account access. See the [report provider contract](orchestration/api/openrouter.md). After changing application code, use `pnpm start` to rebuild images; restart alone reuses the built images.

For Docker diagnostics use `docker compose ps` and local service logs. Avoid printing resolved Compose configuration or sharing logs containing private content. Telegram webhooks require a reachable HTTPS origin and configured accounts; the default local URL is for local inspection. Custom `DEMO_MANIFEST_PATH` must identify a file included in the image, such as `/app/demo/manifest.json`; private host files are not mounted automatically.

For development without the Compose launcher, run `pnpm install` and `pnpm dev`. Those commands require your own configured PostgreSQL and process environment; Vite proxies `/api` to port 3000. `pnpm check` runs the local code checks.

`pnpm demo:preflight` reports database-backed configuration and recovery state without probing providers. Inside Compose, use `docker compose run --rm --no-deps api pnpm demo:preflight`. Admins can inspect jobs, export current or historical runs, and reset the demo explicitly from the workspace. Reset remains separate from setup/start/restart/stop.

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
