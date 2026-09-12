# Security, performance and operation

## Required safeguards

- Authenticate Telegram webhooks with a configured secret and bind the group and sender IDs to one project. Authorize callbacks again; a payload ID or deep link is insufficient.
- Use secure, HttpOnly, SameSite session cookies, password hashing from a standard implementation, login rate limits and origin/CSRF protection for mutations. No role selector masquerading as authentication.
- Check role, project and active run on reads, writes, streams, report exports and attachments. Workers see operational facts; pricing, addresses and approval data require supervisor, purchasing or admin access. Purchasing can prepare but only an authorized supervisor can approve.
- Private files use opaque IDs, normalized storage keys, content-type inspection and authenticated download. Enforce 10 MB per file, audio at most 60 seconds and readable PDFs at most five pages. Reject oversized inputs early; retain permitted originals on extraction failure.
- Do not trust PDF text, image text or retrieved pages as instructions. Apply shared schemas and permitted operation lists. Validate public source URLs and never fetch localhost, private networks or arbitrary model-generated addresses.
- Approval records bind proposal version, selected material/candidate, quantity, date, price snapshot, destination, message text and recipient. Worker claim uses that immutable payload. Never send using a mutable draft.
- Redact secrets and personal data from logs, X-Ray and exports. Render external content as escaped text; open safe external links with appropriate isolation.

## Performance budgets

Retain the PRD budgets as design targets: persisted acknowledgement at most 2 s; text operation 8 s; audio or invoice operation 15 s after file availability; visible update within 1 s after commit; Exa and each Ambiguous resource about 15 s during rehearsal. Exa has a 20 s timeout and a recoverable state.

Record actual stage durations and sample counts. Do not label a single rehearsal as p95. Twenty samples per class, five-user load testing and a twenty-input accuracy study are deferred under the reduced testing instruction.

Assumption: poll the small PostgreSQL queue every 500 ms, use bounded worker concurrency and stream already committed events. Process supplier research and independent office jobs concurrently. Keep payloads small, paginate activity history and load attachments on demand. Do not run model requests inside webhook responses or SQL transactions.

Initial provider rehearsal budget is US$25, with a warning at US$20. Record unknown cost as unknown. Cap retries and research calls; never purchase credits automatically. A worker restart must restore jobs using lease expiry, not in-memory timers.

## Deployment and reset

One HTTPS deployment serves the UI/API; a separate process runs jobs. Database and media volumes survive restarts. Health distinguishes liveness, database readiness, worker heartbeat and provider configuration. Missing access produces a named pending capability, not a fake success.

Reset is an admin action scoped to the expected current `run_id`. Mark it resetting, fence new claims, wait for active writes to settle or mark them uncertain, cancel unsent old jobs and approvals, then seed a new run in a transaction. Preserve audit history and isolate prior remote artifacts. Details are in [operations](../product/operations.md).
