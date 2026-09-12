# Operations handoff

Stage 5 base `210cbb6`; shared Stage 6 checkpoints `160962e` and `dfc4273` add dispatch/operations persistence, shared DTOs and canonical queue/seed helpers. Contribution is the commit containing this handoff. Dispatch integration is complete on merged baseline `630f04d`; the final integration commit contains this updated handoff.

Implemented admin-only readiness/status, current and old run export, known-failure retry, explicit operator observation and atomic demo reset. Status shows configured-versus-verified distinctions, worker heartbeat, pending inputs/jobs, unresolved writes and known spend against a US$25 budget with a US$20 warning. Unknown cost or provider call time remains null, never estimated as zero or an invented timestamp.

Reset locks the run then project and checks unresolved provider writes before changing state. A blocked reset leaves the current run active for reconciliation. Once clear, one transaction fences it as resetting, cancels old unsent jobs, invalidates pending authorization, retires it and calls the existing seed with that transaction. Old input keys, events, approvals, sources and remote identities remain. Repeated reset returns the same new run. Old remote resources stay separated by their existing run markers; no remote delete or archive API is invented.

Canonical retryKnown preserves the original dedupe key and refuses uncertainty. Operations checks domain preconditions before retrying a known failed job. Explicit administrator observations require the exact object ID, note and provider reference where applicable. They cancel the original job and retain an audit record; they do not retry or mark remote content verified. Active worker/object leases cannot be overridden. Commercial requests use dispatch's dedicated reconciliation route.

RunExport includes scoped original input references, operations/events, request proposal versions, candidate field evidence, reports, approvals, sends, followups/replies, remote verified versions and provider/SDK evidence kinds. It strips known credentials, secret-looking text and credential fields. Original media bytes and checkpoint tokens are excluded. Real local Git SHA is read outside the transaction when available; CODE_VERSION supplies the deployed commit where Git is absent. SDK checkpoints are not presented as remote provider calls. Unrecorded OpenAI call timestamps stay null.

## Integration exports

- `OperationsService({transactions,queue,clock?})`, `operationsModule(service,sessions)` register admin status/retry/reset/observation/export endpoints. `context(actorId,projectId,runId?)` supports authorized old-run export without treating it as active.
- `seedDemo(transactions,manifest,tx?)` is the existing seed with the granted optional transaction parameter. No second seed or queue was added.
- `OperationsPanel({projectId,csrfToken})` belongs in the workspace content slot for admin only. It has individual retry controls, reconciliation links, old-run export and exact run confirmation.
- `pnpm demo:reset <run-id> "RESET <run-id>"` uses the provisioned admin and database-backed service. `pnpm demo:preflight` reports local setup/recovery state, with no provider probes. `demo:configure`/`demo:seed` remain the runtime commands.

## Checks

Scoped server and web typechecks passed. One temporary isolated PostgreSQL inspection consumed the tile baseline, reset it, and verified 62% progress, eight tile boxes and four cement bags, no old pending jobs, preserved old operations, redaction of a secret-looking input and stable repeated reset. It also parsed fresh admin status. The temporary probe was removed. Its first execution had a root-workspace import path error; correcting the probe-only import allowed the inspection to pass. No operations suite, paid provider call or extra live rehearsal was added.

The uncertainty and old-run sender behavior reuse office and dispatch critical cases. Admin panel browser interactions are untested here; shared UI controls and feature typechecks are reused. Full send-to-report live evidence remains pending user credentials, not replaced with a fixture claim.

## Configuration and ownership

New nonsecret configuration names: CODE_VERSION and DEMO_ADMIN_USERNAME. No dependency versions changed. Existing secret values were not printed or persisted. Grants for optional seed transaction, canonical retry/cancellation, reply_media classification and audited observation settlement are recorded in ownership.md. FEEDBACK.md absent; parent reported no PRs. User credentials-later override remains in force.

## Stage 6 integration result

Registered operations and dispatch at the existing composition roots. The single Telegram webhook delegates configured recipient traffic to dispatch while preserving intake jobs and fallback. Reporting consumes dispatch followup sections. Request controls remain restricted to cost-authorized roles and operations controls to admins, with server authorization retained.

One combined gate passed with the isolated PostgreSQL fixture enabled: `TEST_DATABASE_URL=<local fixture database> pnpm check`, all builds/typechecks and 13 critical tests across seven files. Only the existing SDK bundle-size warning remains. An additive export correlation improvement followed the gate: explicit local/provider input references and provider evidence subject IDs. The affected server typecheck passed afterward. No additional provider probe or live journey was run.

The admin reset/export inspection above and dispatch's controlled PostgreSQL uncertainty/restart checks are local evidence. Real Telegram send-to-report and office read-back acceptance remain pending user credentials. Release readiness is the next assigned stage. FEEDBACK.md remains absent at handoff.
