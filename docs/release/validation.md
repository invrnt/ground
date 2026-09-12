# Validation record

Checked application commit: `52833a7033eb801163fb5159bb9bee0cba5e7a89`, 2026-09-12. Host Node 26.7.0, pnpm 11.24.0, isolated PostgreSQL 18.4. No provider calls were made during release validation.

`pnpm install --frozen-lockfile --reporter=silent` passed. One `TEST_DATABASE_URL=<isolated PostgreSQL connection> pnpm check` passed typecheck, build and all 13 critical tests across seven files. Database cases ran and were not skipped. Each test used a unique schema and removed it afterward. The pre-existing large CopilotKit bundle warning remains; no performance campaign was added.

| Critical file | Tests | Outcome |
| --- | ---: | --- |
| ingestion.critical.test.ts | 3 | Passed |
| site.critical.test.ts | 2 | Passed |
| purchases.critical.test.ts | 1 | Passed |
| sourcing.critical.test.ts | 3 | Passed |
| procurement.critical.test.ts | 1 | Passed |
| workspace-sync.critical.test.ts | 2 | Passed |
| dispatch.critical.test.ts | 1 | Passed |

The observed release configuration repair pins container HOST/private storage/web output paths in Compose and initializes node ownership for the image's private directory. `docker compose config --no-env-resolution --format json` parsed successfully; assertions confirmed both containers use the mounted private path and the API remains published only on host loopback. Docker image execution was not performed during that historical release gate because daemon access was unavailable. Later work is recorded separately below.

## Docker runtime smoke check

On 2026-09-12 the operator used sudo to access the already-running Docker daemon, version 29.7.2. The existing lifecycle setup/start commands built the Node 24.21.0 images, installed the frozen dependencies, built the application, applied migrations through 014-channel-providers.sql, provisioned the demo accounts and seeded an active run. API and PostgreSQL were healthy and the worker was running. `/health/ready` returned HTTP 200 locally and through the configured HTTPS tunnel; the local login route returned HTML with HTTP 200.

The private manifest was mounted read-only in both application containers. Configured mount paths were checked without printing resolved secrets. The manifest still reported missing user mappings, material details, address, media and recipient reachability. No completed login, audio extraction, approved send or Ambiguous write chain is claimed by this check.

This is an operational smoke check of the image built at that time, including the local manifest mount change. It is not a repeat of the historical critical gate or evidence for subsequent application commits. The live recording and shareable run evidence remain pending. Private endpoint URLs, credentials and user identifiers are omitted from this public record.

## Original acceptance inventory

“Local” below means controlled tests or prior documented inspection, not a live provider journey.

| ID | Available evidence | Remaining acceptance |
| --- | --- | --- |
| T01 | Intake/session authorization tests | Real mapped group/account setup |
| T02 | Interpretation boundary + real database scenario, controlled model response | Actual Telegram audio/photo and live model |
| T03 | Controlled clarification boundary | Human ambiguity flow |
| T04–T05 | Site critical tests | None for local invariant |
| T06–T07 | Purchase critical test, invoice remains stock 4 and receipt reaches 10 once | Live invoice extraction/support clip |
| T08 | Site assignment/dependency data and component inspection | Live due-date edit and remote read-back |
| T09 | Reporting's persisted 20-box/Juan query observation | Live query in main/support recording |
| T10 | Sourcing A/B/C fixture invariants | Fixtures are not live prices |
| T11 | Procurement authorization and dispatch tests | Actual one approved delivery |
| T12 | Same-version HTML/PDF pair, live protocol evidence access | Final run report/X-Ray and remote version |
| T13–T16 | Intake/site/procurement critical tests | Main journey correlation |
| T17 | Dispatch uncertain-send regression | Use controlled evidence; do not repeat live send |
| T18 | Persisted follow-up/restart/cancellation test | Actual supporting reminder recording |
| T19 | Site compensation and procurement invalidation tests | Supporting correction/amendment clip |
| T20–T21 | Controlled parser/refusal/boundary observations | Supporting human unreadable/source-instruction check |
| T22 | Procurement role/token/version checks | None for local invariant |
| T23 | Live two-client protocol/checkpoint observation, persisted job recovery | Full browser reconnect/failure flow |
| T24 | Operations isolated reset/export observation | Authorized live support reset |
| T25 | Real SDK sample state/tool/human response/reload; production bridge tests | Full authenticated production Change/approval/reload |
| T26 | One real Exa search/content result from Stage 1, reused | Actual configured material and opened source in main run |
| T27 | Sourcing quantity/unknown-charge critical cases | None for local invariant |
| T28 | Public Ambiguous schema + controlled read-back/reconciliation tests | Real file/task/document account writes and verified reads |
| T29 | Office create-timeout/reconciliation tests | None for local invariant |
| T30 | Dispatch/report/export local observations | Received Telegram request and same updated remote document |

The main all-provider journey and supporting recording are pending credentials/media. No live video, full recording, event eligibility or evaluator access is claimed. Twenty-input accuracy studies, statistical timing/p95, load campaigns, exhaustive browser testing and three repeated rehearsals remain deferred by the user's testing override.
