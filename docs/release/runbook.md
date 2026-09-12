# Install, run and recover

For local setup, use `pnpm run setup`, then `pnpm start`; see the [quick-start guide](../../README.md#run-locally). `pnpm restart` stops and recreates API plus worker to load `.env` changes. `pnpm stop` retains volumes. Provider keys may remain pending while inspecting the local app. Docker daemon access is required; local script checks do not prove a Docker deployment or live integration.


## Local setup

Use Node 24.21.0, pnpm 11.24.0, PostgreSQL 18.4 and ffmpeg. The lockfile pins all package versions. The historical release gate ran on host Node 26.7.0. A later Docker smoke check built and started the pinned Node 24 image; see [validation](validation.md#docker-runtime-smoke-check).

```sh
pnpm install --frozen-lockfile
test -e .env || cp .env.example .env
```

Edit `.env` privately. Load it into the process environment with your existing environment launcher. For a trusted, shell-compatible file you authored, `set -a; . ./.env; set +a` exports its values without printing them. Do not use `cat`, `env` or shell tracing when secrets are loaded.

Set DATABASE_URL to your local PostgreSQL database, PRIVATE_STORAGE_PATH to an absolute private directory, and PUBLIC_BASE_URL to the exact browser origin. Use `http://localhost:3000` for the built UI served by the API. If using Vite through `pnpm dev`, use `http://localhost:5173` instead; otherwise the login Origin check will reject the request. API and worker must share the same database, private path and configuration.

Provision all five unique passwords, each at least 12 characters. Set a stable SESSION_SECRET of at least 32 characters and preserve it across restarts. Set CODE_VERSION to the deployed commit, for example `export CODE_VERSION="$(git rev-parse HEAD)"` before launching a build whose Git metadata will be omitted.

Keep the tracked demo manifest unchanged as the unconfigured example. Make a private copy under ignored `.storage/`, set DEMO_MANIFEST_PATH to its absolute path, and fill the actual material reference, Telegram identities, authorized recipient, test address, Ambiguous mapping and media metadata. Do not put credentials in the manifest.

```sh
pnpm db:migrate
pnpm demo:configure
pnpm demo:seed
pnpm build
```

Run the API and worker in separate terminals with the same loaded environment:

```sh
pnpm --filter @ground/api dev
pnpm --filter @ground/worker dev
```

Open the configured origin and sign in as a provisioned account. `/health/live` proves API liveness. `/health/ready` also requires a recent worker heartbeat. `pnpm demo:preflight` shows configuration and recovery problems without making provider probes; a nonzero exit while credentials are pending is expected. Configured does not mean provider-verified.

## Configuration map

| Configuration | Required value |
| --- | --- |
| DATABASE_URL | Private PostgreSQL database, no public exposure |
| PRIVATE_STORAGE_PATH | Absolute directory shared by API and worker |
| PUBLIC_BASE_URL | Exact HTTPS production origin, or exact localhost development origin |
| SESSION_SECRET | Stable private secret, at least 32 characters |
| DEMO_PASSWORD_ADMIN/LUIS/ANA/JUAN/PURCHASING | Unique initial account passwords, at least 12 characters |
| DEMO_MANIFEST_PATH | Private configured manifest copy |
| TELEGRAM_BOT_TOKEN / TELEGRAM_WEBHOOK_SECRET | Bot credentials and webhook secret |
| AI_PROVIDER | `openrouter` by default, or `vercel`; restart API and worker together |
| OPENROUTER_API_KEY / OPENROUTER_TRANSCRIPTION_MODEL / OPENROUTER_INTERPRETATION_MODEL | Required only for OpenRouter; no model is assumed |
| AI_GATEWAY_API_KEY / AI_GATEWAY_TRANSCRIPTION_MODEL / AI_GATEWAY_INTERPRETATION_MODEL | Required only for Vercel; transcription beta account access must be checked |
| EXA_API_KEY | Exa account key |
| AMBIGUOUS_API_TOKEN / AMBIGUOUS_WORKSPACE_ID | Authorized Ambiguous account/workspace |
| AMBIGUOUS_BASE_URL | Normally `https://app.ambiguous.ai`; official API version is 1 |
| FFMPEG_PATH | ffmpeg executable; default `ffmpeg` |
| CODE_VERSION | Exact deployed Git commit for exported evidence |
| DEMO_ADMIN_USERNAME | Provisioned operator identity, default `admin` |

Manifest fields are authoritative for Telegram group/sender IDs, the demo recipient, test address, Juan's remote user and material/media references. The example names TELEGRAM_DEMO_CHAT_ID, TELEGRAM_DEMO_RECIPIENT_ID and AMBIGUOUS_JUAN_USER_ID are not automatically copied into the manifest by provisioning. COPILOTKIT_PUBLIC_API_KEY is optional; the current local SDK bridge does not require it.

Bind the Telegram webhook to `PUBLIC_BASE_URL/webhooks/telegram` with the configured secret through the team's normal bot setup. Confirm the real group, Luis/Ana/Juan mappings and a started, reachable authorized recipient conversation. Do not test with a real merchant destination. Ambiguous's native due date is date-only; Ground includes exact UTC/Bogotá time in the task description. Verify the real account's managed document block ID and read-back before recording.

## Compose deployment

Provide the private `.env`, a private configured manifest, and an HTTPS reverse proxy for localhost port 3000. Compose explicitly sets HOST=0.0.0.0 and PRIVATE_STORAGE_PATH=/storage/private inside containers, so local environment defaults cannot break container reachability or persistence. A fresh private volume inherits ownership from the image's node-owned directory. Existing root-owned volumes need operator ownership correction before use.

```sh
docker compose build
docker compose up -d db
docker compose run --rm api pnpm db:migrate
docker compose run --rm api pnpm demo:configure
docker compose run --rm api pnpm demo:seed
docker compose up -d api worker
```

Create a private host copy if one does not already exist:

```sh
mkdir -p .storage/demo
test -e .storage/demo/manifest.json || cp demo/manifest.json .storage/demo/manifest.json
```

Set `DEMO_MANIFEST_PATH` in `.env` to the absolute host path of that file. Complete the manifest before provisioning. The checked-in Compose file bind-mounts it read-only at `/config/manifest.json` for both API and worker. No separate override is required. The container environment uses that target path automatically; the host setting must remain the source path. The file must exist and be readable by the container's node user. Keep its parent directory private. `.storage` and `.env` are excluded from Git and the image build context.

When `DEMO_MANIFEST_PATH` is empty, Compose uses the tracked unconfigured example. It cannot invent user mappings or material facts. The lifecycle commands encode POSTGRES_PASSWORD into the container connection URL; for the direct Compose commands above use a URL-safe password or explicitly provide a correctly encoded GROUND_COMPOSE_DATABASE_URL. PostgreSQL remains private and the API is exposed only on host loopback. A later local Docker startup check passed; a persistent hosted deployment and live provider acceptance remain separate checks.

## Reset and uncertain work

Sign in as admin, inspect Operations and resolve all uncertain external writes using provider evidence. A reconciliation observation does not resend a request. Never turn an uncertain send into an automatic retry. Retired-run records remain available for export.

Use the current run ID shown in Operations:

```sh
pnpm demo:reset <run-id> "RESET <run-id>"
pnpm demo:preflight
```

Reset refuses unresolved external writes. Once safe, it fences the old run, cancels pending work and seeds the new baseline atomically. Confirm 62% reported progress, eight tile boxes and four cement bags. Do not reset with manual SQL or delete old audit rows. The same reset command is idempotent.

## Record and export

Follow the single [main journey](../../orchestration/testing/critical-journeys.md) once after credentials are ready. Keep the uncut recording. Use the short supporting session for invoice/receipt, correction and recovery. Prior critical checks can supply the controlled uncertainty evidence; do not deliberately create duplicate live messages.

From the admin Operations panel, download the run export. Review it for personal data and intended evaluator scope even though known secrets are redacted. The export endpoint is `/api/projects/:projectId/runs/:runId/export` and requires the authorized admin session. Store the real export and recordings in approved private artifact storage, then update the evidence index with their hashes and authorized evaluator links. Do not replace the labelled local baseline export with an unlabelled fixture.

See the [report provider contract](../../orchestration/api/openrouter.md) for compatible model selection and pending live checks. Configuration alone does not verify access.
