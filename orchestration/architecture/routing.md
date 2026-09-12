# Routing and entrypoints

## Browser routes

| Route | View owner | Behavior |
| --- | --- | --- |
| `/login` | interface-foundation | Demo account sign-in, expired session, return to authorized destination |
| `/projects/:projectId` | live-workspace | Shared shell, current progress, inventory, issues, X-Ray and query entry |
| `/projects/:projectId/evidence/:evidenceId` | live-workspace | Author, original message, protected attachment and operation history |
| `/projects/:projectId/purchases` | purchases | Invoice details, receipt confirmation and duplicate state |
| `/projects/:projectId/needs/:needId` | sourcing | Calculation, candidates and attributable public sources |
| `/projects/:projectId/proposals/:proposalId` | procurement | Exact version, change, rejection and approval |
| `/projects/:projectId/requests/:requestId` | dispatch | Send outcome, replies and follow-up |
| `/projects/:projectId/reports/:date` | reporting | HTML report, version, PDF download and Ambiguous link |
| `/projects/:projectId/operations` | operations | Admin health, pending work, retry, reset and run export |

These may be panels inside the same shell with stable URLs. Do not build separate dashboards for every entity. The shared owner alone edits route and feature registration files. Features own their content and translations.

Telegram deep links point to a route; they grant no session or approval. Return paths must be local and authorized. Evidence IDs are not access tokens. Render a useful forbidden or expired state without exposing resource details.

## Backend entrypoints

`apps/api/src/main.ts` starts Fastify, health endpoints, session middleware, routes, AG-UI transport and static web hosting. `apps/worker/src/main.ts` runs durable inbox, outbox and scheduled-job loops. `register.ts` files and `packages/server/src/composition.ts` are the only wiring points.

Serve web and API on one origin in deployment. Development uses the Vite proxy. SPA fallback must exclude `/api/*`, `/health/*` and `/webhooks/*`. Preserve authentication and cache rules for streams, private files and PDF responses.

Ground's HTTP map is specified in [api/endpoints.md](../api/endpoints.md). Provider URLs belong only inside provider adapters and server configuration.
