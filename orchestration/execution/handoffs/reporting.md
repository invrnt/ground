# Reporting handoff

Stage 4 base `92a0f1f`; shared checkpoints `272fc4a`, `2aa9d71` and `13433c1` merged before completion. Contribution is the commit containing this handoff. Edited only server reporting module, web reports feature and this handoff. No FEEDBACK.md was present; the Orchestrator reported no PR feedback.

Implemented bounded inventory/progress/open-issue/task/tomorrow queries from the canonical scoped snapshot, immutable audience-specific ReportSnapshots, shared HTML/PDF blocks, report and query UI exports, and a bounded content-event poll. No external model, second quantity calculation or Ambiguous client was added. Telegram QueryPort returns Spanish copy and source evidence routes; web answers default to English. Relative tomorrow uses the manifest scenario date. Unsupported questions ask for a supported query rather than running database chat.

## Registration

Construct `ReportingService({transactions:runtime.transactions,projects:runtime.projects,queue:runtime.queue,supplements})`, then register `reportingModule(service,runtime.sessions)`. The returned module has `poll:()=>service.poll()` for the shared worker tick. Server routes implement queries, report JSON/HTML, exact-version PDF and current remote-link metadata. PDF requests require the stored report's version; dates outside the active scenario only return already-stored reports.

- `service.snapshot(context,date,tx?)` implements ReportService and persists the shared DTO. `service.version(context,date,version)` retrieves the exact authorized historical version. `service.query(context,text,locale?)` returns QueryAnswer. `service.answer(context,text)` returns Spanish `{text}` for interpretation's existing QueryPort.
- `supplements.sources(context,tx)` returns persisted `{id,url,title}` sources from sourcing. `supplements.purchases(context,tx)` returns `{sections,evidence_ids}`. Wire it as `purchaseReportSections(await purchases.list(context,tx))`; the helper consumes the shared PurchaseList, preserving invoice/receipt distinction and null unknown totals. Use the same transaction for all supplement reads, with no provider calls.
- Office-sync later provides `supplements.links(context,tx)` and dispatch provides optional `supplements.followup(context,tx)`. Remote document links are metadata through `/reports/:date/links`; they do not rewrite an immutable content snapshot. The current project/run has one scenario report date. Filter supplied links to the correct report identity when office-sync registers them.
- `QueryWidget({projectId,csrfToken})` goes in the live workspace `slots.query`. `ReportView({projectId,date})` is exported for shared route registration. No workspace, route or composition file was edited here.

## Durable report refresh

The worker poll processes at most ten active projects per tick, scans only REPORT_CONTENT_EVENTS after the persisted run cursor, and creates each available operational/financial audience report using an actual scoped member. It commits the report, canonical coalesced `sync_report` job and event cursor together. Dedupe key is `run:sync_report:project:scenarioDate`; payload subject_id is the immutable report UUID and expected_version is its version. Purchases agreed to emit events only, avoiding a second report scheduling path.

`report_event_cursors.last_report_id` tracks the last enqueued report, so opening a report before the worker poll cannot suppress its sync. Repeated polls do not create another job. The content hash excludes remote-link metadata. Remote sync and job events are excluded from REPORT_CONTENT_EVENTS, preventing a report/sync feedback loop. Later proposal, approval, request, reply and follow-up event families are already included. The queue must be injected before poll advances a cursor; pending office credentials leave the real job stored for its later handler.

Operational and financial snapshots have different storage audience keys. Current member roles are reloaded before retrieval. A worker cannot retrieve the privileged snapshot by requesting its version. Source evidence IDs also filter restricted documents. Report sections use canonical totals/quantities and distinguish invoiced quantities from physically received quantities.

## Checks

- Scoped server/web typecheck and build passed against the merged shared dependencies. Shared application route/query/poll registration remains the shared owner's integration step.
- A temporary bounded check, removed after execution, used runtime's isolated PostgreSQL schema and actual SiteService commands to complete tiling, consume eight boxes, report a long north-wall issue and assign Juan. Query returned 20 cajas for 2026-09-13, Juan's 09:00 Bogotá review and project version 4. Repeated snapshot reads returned the same report ID; exact-version retrieval matched; worker access to the financial version failed and generated a separate operational snapshot.
- The same check opened a report before calling poll, then polled twice. Exactly one sync_report job remained, and the cursor's last_report_id matched the financial snapshot. This covers the read-before-poll scheduling case without a broad new suite.
- Generated one HTML/PDF pair from that same version-4 DTO. All section text and version matched PDF text extraction and HTML. The HTML escaped a source `<script>` string instead of executing it. Poppler rendered both PDF pages; both were visually inspected with clean wrapping, margins, headings and page footers. The long issue and Spanish characters remained readable. No screenshots or sample report are committed; QA artifacts are under `/tmp/ground-report-check`.
- No browser report-route walkthrough, live sponsor call or Ambiguous same-document read-back is claimed. These remain for integrated registration and the release journey. Credential-dependent checks remain pending under the user's override.

## PDF implementation and versions

Uses the existing pdf-lib 1.17.1 and shared-owner-added @pdf-lib/fontkit 1.1.1. Bundles LiberationSans-Regular.ttf with its SIL Open Font License in the owned fonts directory. Font embedding preserves the supported source characters; an unsupported glyph fails visibly with NOT_READY and leaves the HTML/source intact, rather than silently replacing it. The existing Docker executes source through tsx and copies the bundled font; an alternative dist-only deployment must copy this font asset too.

Verified official `PDFFont.widthOfTextAtSize`, `getCharacterSet`, `PDFDocument.registerFontkit`, font embedding and drawText APIs at https://pdf-lib.js.org/docs/api/classes/pdffont and https://pdf-lib.js.org/. Used the PDF skill's marker once before sample generation, then Poppler rendering for visual QA. No new runtime configuration names. Existing PUBLIC_BASE_URL/session origin supplies protected evidence URLs. The user’s reduced testing instruction was followed; no report formatting suite was introduced.
