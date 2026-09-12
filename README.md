# Ground

A construction workspace connecting Telegram reports to project records and reviewed procurement requests. Product requirements are in [PRD.md](PRD.md). Stage 1 currently supplies the workspace, shared contracts and isolated SDK probe. Product routes return `NOT_READY`.

Use Node 24.21.0 and pnpm 11.24.0. Run `pnpm install`, then `pnpm check`. Copy `.env.example` to `.env` and fill in configuration locally. Scripts read process environment; load your environment through your shell or deployment launcher without printing secrets. Run `DATABASE_URL=... pnpm db:migrate` against your local database. `pnpm dev` starts the API, worker and web development processes. The Vite web server proxies `/api` to port 3000.

`pnpm demo:preflight` reports only configuration presence. Configure, seed and reset commands return `NOT_READY` until runtime and operations register them. No fake demo data is supplied by foundation.

Compose defines PostgreSQL plus an API and worker with private persistent storage. Set `POSTGRES_PASSWORD`, run migrations before starting application services, and attach an existing HTTPS reverse proxy to localhost port 3000. No deployment host is configured yet. Provider secrets remain server-side.

## SDK probe

Run `pnpm probe:server`, then `pnpm --filter @ground/web exec vite ../../tools/probes --host 127.0.0.1 --port 5174`. Open `http://localhost:5174`, load the sample checkpoint, reload and load again, then confirm it. CopilotKit's `useHumanInTheLoop` response travels through the AG-UI client back to the backend. The probe saves the checkpoint atomically in ignored `.storage/probe-checkpoint.json`. It performs no external send. A previously confirmed checkpoint stays confirmed.

The probe is loopback-only and deliberately outside application registration. Stage 3 replaces it with authenticated project events, PostgreSQL checkpoints and the real ApprovalService. The sample's file persistence proves reload feasibility, not production authorization or database recovery.
