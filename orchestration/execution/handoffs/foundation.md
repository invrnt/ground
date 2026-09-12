# Foundation handoff

Stage 1 base: `be4fb4d`. Contribution commit is the commit containing this handoff; integration commit is pending the Orchestrator's merge.

Created the six pnpm workspace packages, strict TypeScript configuration, build/check workflow, API/worker/web entrypoints, shared contracts, ports, errors, event/job envelopes, module registration slots, migration runner, deployment shape and isolated probes. Domain exports remain empty. No later-stage feature folders were created. Unregistered API routes return HTTP 503 `NOT_READY`; demo mutation commands fail visibly. No FEEDBACK.md was present at start or handoff. The Orchestrator reported no initial GitHub PRs.

The user explicitly allows implementation to continue while they create credentials later. Recorded this scheduling override in testing strategy and build order. Pending live provider checks remain pending, without invented results.

## Checks and results

- `pnpm install --frozen-lockfile --reporter=silent`: passed. Scarf telemetry install script disabled; esbuild allowed. pnpm reports optional transitive peer warnings for channels-core's Vitest 4 expectation and Slack Bolt's Express 5 types. Neither is used by the isolated probe or product scaffold; installed imports compile and execute. Do not treat those optional integrations as verified.
- `pnpm check`: passed, typecheck plus all workspace builds plus critical runner. Zero application tests exist in Stage 1, explicitly allowed by strategy.
- Schema import smoke check: passed. Schemas live in `schemas.ts` to avoid an index/event initialization cycle.
- PostgreSQL 18.4 isolated probe: `pnpm db:migrate` applied `001-probe.sql`; one sample checkpoint insert and SELECT succeeded. Host PostgreSQL was absent and Docker denied access. A temporary `embedded-postgres@18.4.0-beta.17` npm install under `/tmp/ground-foundation-pg` supplied the real PostgreSQL binary. This is not a project dependency. Database `ground_foundation`, port 55431, is isolated from demo data. Runtime should provision its own database and use the checked-in migration runner.
- Real browser SDK check at localhost:5174: load produced `status: pending` and the SDK-rendered confirmation tool. Browser reload and load restored the same `foundation-demo` / `foundation-confirm` IDs. Clicking the hook-provided response button sent the AG-UI tool result to the Fastify backend, which persisted and returned `status: confirmed`. Checkpoint storage is an atomic private file, not PostgreSQL. No supplier message was sent.
- Final provider-script typecheck passed. Default checks make no paid calls.
- Docker image/Compose execution, Node 24 execution and remote HTTPS deployment remain untested. Local checks ran on host Node 26.7.0; CI and Docker pin Node 24.21.0.

## Provider capability record

| Provider | Result | Evidence or pending work |
| --- | --- | --- |
| CopilotKit / AG-UI | Verified bounded SDK state/tool/response/reload | React v2 `useAgent`, `useHumanInTheLoop`, `CopilotKitProvider`, `CopilotChat`; `HttpAgent` and SSE encoder. Dev-only local agent registry is isolated from production. |
| Exa | Verified one search and contents request | POST `https://api.exa.ai/search`, query `porcelanato gris 60x60 Colombia`, numResults 1. Returned `https://porcelanite.com.co/producto/urban-grey-60x60/`. POST `/contents` with that URL and text maxCharacters 500 returned one result. This is access evidence, not verified price or product compatibility. |
| Telegram | Pending credentials | No bot token, group/chat IDs, webhook or reviewed recipient supplied. No send probe. |
| OpenAI | Pending credentials | No API key or configured model names. Transcription, image and structured-output account access unverified. |
| Ambiguous | Pending credentials and account schema | Public `https://www.ambiguous.ai/agents/api` retrieval failed. No account token, workspace or Juan mapping. Exact external methods/paths, upload flow, task fields, due-date semantics, revisions, read-back and reconciliation remain unverified. Local port names are not endpoint claims. |

No private provider responses or tokens are stored. The only configured root provider name observed was EXA_API_KEY. The Exa probe consumed its value in one invoked process and did not print it.

## Versions and retrieval

Pinned Node 24.21.0, pnpm 11.24.0, TypeScript 5.9.3, Vite 8.3.0, React/React DOM 19.3.0, Fastify 5.12.4, pg 8.23.0, Zod 3.25.76, Vitest 3.2.7, tsx 4.23.13, decimal.js 10.6.0, pdf-lib 1.17.1, CopilotKit core/react-core/runtime 1.71.1, AG-UI client/core/encoder 0.0.59. All direct versions and transitive resolutions are in manifests and lockfile.

Official docs checked on 2026-09-12: [Node releases](https://nodejs.org/en/about/previous-releases), [pnpm workspaces](https://pnpm.io/workspaces), [Vite guide](https://vite.dev/guide/), [Fastify](https://fastify.dev/docs/latest/), [pg transactions](https://node-postgres.com/features/transactions), [CopilotKit useAgent](https://docs.copilotkit.ai/reference/hooks/useAgent), [human interaction](https://docs.copilotkit.ai/reference/hooks/useHumanInTheLoop), [AG-UI events](https://docs.ag-ui.com/concepts/events), [Telegram API](https://core.telegram.org/bots/api), [Exa search](https://exa.ai/docs/reference/search) and [contents](https://exa.ai/docs/reference/get-contents). Installed SDK declarations verified exact hook imports and matched AG-UI dependencies. Vite requires Node 20.19+ / 22.12+; the Node 24 target meets that requirement. Migration runner uses one checked-out pg Client and transaction with an advisory migration lock.

## Configuration and next owners

Names are in `.env.example`: DATABASE_URL, POSTGRES_PASSWORD, PORT, HOST, PRIVATE_STORAGE_PATH, PUBLIC_BASE_URL, SESSION_SECRET, TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_DEMO_CHAT_ID, TELEGRAM_DEMO_RECIPIENT_ID, OPENAI_API_KEY, OPENAI_TRANSCRIPTION_MODEL, OPENAI_INTERPRETATION_MODEL, EXA_API_KEY, AMBIGUOUS_API_TOKEN, AMBIGUOUS_BASE_URL, AMBIGUOUS_WORKSPACE_ID, AMBIGUOUS_JUAN_USER_ID, COPILOTKIT_PUBLIC_API_KEY. WEB_DIST is an optional API override used by Docker. Values must stay outside Git. Scripts expect process environment and do not automatically source `.env`.

Runtime owns real database/transaction/session/storage implementation and production schema. Ensure the named private volume is writable by the node user during deployment provisioning. API and worker composition is empty. Register each merged module once through the shared owner. `TransactionContext` carries a transaction identity; runtime can map this to its checked-out client without exposing pg in contracts. Project read entities use a typed scalar field map, and feature owners should request precise shared schema refinements through their stage shared owner.

Live workspace must replace the isolated dev-only SDK registration with authenticated runtime routing and database checkpoints. The real approval path needs run fencing, proposal version/hash/token/role validation and canonical ApprovalService. The probe is not an authorization implementation. Keep it loopback-only and out of product registration.
