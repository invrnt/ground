# Dispatch handoff

Stage 6 base `210cbb6`; merged shared checkpoint `dfc4273` before checks. Contribution commit is the commit containing this handoff. Edited only dispatch server module, requests feature and this handoff. FEEDBACK.md absent; Orchestrator reported no PR feedback.

Implemented approved RFQ dispatch through the existing Telegram adapter. The pre-send transaction locks active run/project/request, calls ProcurementService.authorizedDispatch, verifies the returned immutable row and persists the send claim before the provider call. The exact approved text and recipient are sent unchanged. The public request reference already in that text is the proposal UUID; the outbound row has its own audit UUID. Confirmed responses retain provider message ID/chat/time. No second Telegram client or approval path exists.

Unknown outcomes persist as uncertain and cannot automatically send again. A still-live send claim is left in progress; an expired claim becomes uncertain. Known not-applied failures preserve safe retry eligibility with bounded attempts and fresh authorization on each retry. Manual reconciliation records actor, observation, note, evidence and idempotency key. Confirmed non-delivery remains failed/nonretryable and requires a newly approved request. Reconciliation itself never sends. Active and resetting runs support authorized reconciliation; retired runs cannot start a send.

Authorized demo-recipient replies use the same webhook secret/client. A private recipient conversation requires matching chat/sender identity; configured group conversations require a mapped project sender. Replies match the confirmed message ID or an explicit request/proposal reference. Ambiguous replies remain unmatched until a supervisor selects the request. Original text, sender, timestamps, message/update/reply IDs and media descriptors persist once. Allowed reply media is retained through a read/storage job using the existing private store, with restricted access. Replies never become purchases, receipts or approvals.

A confirmed send creates one durable follow-up to Ana after the configured demo delay of 120 seconds. Its condition is awaiting_reply. Execution rechecks run, request state, existing replies and Ana's current mapping before claiming a reminder. Resolved or retired work cancels it; interrupted/uncertain reminders cannot repeat automatically. Reminder copy contains a request reference and authenticated Ground link, without costs, address or approval details. Missing Ana mapping stays a visible configuration failure.

Request events feed the existing reporting/office pipeline. `reportSections` adds delivery, reply count and follow-up status/due time in America/Bogota. No second report scheduler is added. Request details are restricted to current stored supervisor/admin/purchasing roles; reconciliation and manual reply association require supervisor/admin.

## Integration exports

- `DispatchService({ transactions, queue, authorization: procurement, adapter, bot_id, files, clock?, public_base_url })`. Reuse the already-created BotTelegramAdapter and the nonsecret bot identity. No token enters persistence.
- `dispatchModule(service, sessions)` exports dispatch_request/follow_up handlers and list/detail/reconcile/reply-link routes under `/api/projects/:p/requests`.
- Register `/webhooks/telegram` once using `dispatch.webhook(secret, body, () => intakeService.accept(secret, body))`. Retain ingestion's send_channel_reply jobs while replacing only its route registration at the shared composition root. The wrapper routes the configured recipient conversation before ordinary intake; ordinary worker reports retain their existing path.
- `list(context, tx?)` and `get(context, id)` provide the shared request DTOs, including unmatched replies. `requestContext` resolves the current stored member and active/resetting run from a trusted session user ID for those routes.
- Reporting's followup supplement calls `dispatch.reportSections(context, tx)`. Operations can reuse list/read data for authorized status/export without another send path.
- `RequestsPanel({ projectId, csrfToken })` is the UI export. Render for cost-authorized session roles in the existing workspace slot. The API independently verifies current stored roles. Reconciliation is an observation form, not a resend button.
- With missing Telegram configuration, keep provider send jobs unclaimed as configuration-pending. Reply media uses follow_up condition `reply_media`, which the shared queue classifies as safe read/storage recovery.

## Checks

The critical file first failed on the missing service. Final `TEST_DATABASE_URL=<isolated local connection> pnpm exec vitest run packages/server/src/modules/dispatch/dispatch.critical.test.ts` passed using real scoped PostgreSQL transactions, the actual procurement authorization port and a controlled Telegram transport. It proves an uncertain send makes one provider attempt across service recreation; repeated non-delivery observations make one audit row and cannot resend the old request; a confirmed send persists the follow-up; a matched reply cancels it after the injected two-minute advance; and retired runs cannot send or deliver pending reminders. The unique fixture schema is dropped afterward. Test time is set after seed creation so the synthetic reply does not predate the run.

Server and web typechecks passed. Chrome inspection of a labelled synthetic request view showed the uncertain state, exact approved text expansion, Demo recipient, labelled message-ID/observation fields and confirmation checkbox. Temporary preview files, process and tab were removed. No observation form was submitted through the preview.

No live Telegram delivery, real merchant message, provider media download, full authenticated browser send or shared release journey ran. Real request/received-message acceptance remains pending credentials and the authorized reachable demo conversation. The credential timing override permits progression without claiming that acceptance. No broad test suite, extra provider SDK or performance campaign was added.

## Versions and configuration

Reused the prior verified Telegram send/reply semantics and frozen adapter. Unknown send outcomes remain uncertain because Telegram offers no Ground idempotency key or guaranteed lookup by request ID. No new provider API was needed. Existing pg 8.23.0, TypeScript 5.9.3, Zod 3.25.76, React 19.3.0, Vitest 3.2.7, UI components, API client and formatters are reused.

No new configuration names. Existing Telegram bot/secret, demo recipient/reachability, Ana sender mapping, reminder_delay_seconds, PUBLIC_BASE_URL, database and private storage apply. Values and credentials are not recorded here. Shared owner owns migrations 012/013, queue policy and composition registration.
