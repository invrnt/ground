# Live workspace handoff

Stage 3 initial base `be846e5`; rebased onto shared contract checkpoint `0cfd7bd` and merged site contribution `d769512`. Contribution is the commit containing this handoff. Only live server module, Copilot adapter, workspace/evidence features and this handoff were edited. No FEEDBACK.md was present; the Orchestrator reported no PR feedback.

Implemented scoped snapshot/evidence reads, bounded event history, authenticated SSE updates with reauthorization every three seconds, actual CopilotKit tool rendering, a single SDK state adapter, project/stock/work/issue/task/need views, evidence operation history, issue resolution and assignment status/due actions. Server state stays in the AG-UI agent, not localStorage or a second application store. Source text stays intact. Worker responses omit cost/approval families and restricted document evidence. Streams reload a complete consistent snapshot to recover a missing cursor or changed run.

## Wiring for the shared owner

- Construct `LiveService(runtime.transactions, runtime.projects, {history:(ctx,id,tx)=>site.history(ctx,id,tx), transcript:(ctx,id,tx)=>interpretation.transcriptForInput(ctx,id,tx)})`.
- Register `liveModule(service, runtime.sessions, optionalDecisionTransport)` once in composition. Server routes include project snapshot, evidence, event stream, agent/run and the `/api/copilotkit` AG-UI bridge. This bridge consumes `RunAgentInput`; the frontend configures a self-managed HttpAgent rather than the CopilotKit remote runtime discovery protocol.
- Replace the placeholder web shell with `LiveWorkspace({session,slots?})`. It chooses an authorized project ID from the URL or session. It renders evidence URLs in the same shell.
- `slots.query` accepts reporting's later widget. `slots.supplierTools` accepts the later supplier tool registration. `slots.decision` accepts procurement's renderer. No supplier comparison or procurement approval card was implemented here.
- Actual StateChangeCard and IssueCard register through `useRenderTool` and render with `useRenderToolCall`; pending human tools use `useHumanInTheLoop`. Uses foundation-pinned CopilotKit 1.71.1 and AG-UI 0.0.59 with stable `selfManagedAgents`, not the dev-only registry.

## Checkpoint transport

`LiveService.persistCheckpoint(context,checkpoint,tx)` inserts pending identity into shared `live_interactions` inside the proposal owner's transaction. It validates the project/run thread and active scoped context. Proposal/version uniqueness preserves the first logical identity. Procurement must reuse that identity for retries and use this table, not create a second checkpoint mechanism.

The optional `DecisionTransport.arguments` returns the current authorized proposal arguments and checkpoint token. The bridge adds checkpoint_id and tool_call_id itself. `DecisionTransport.decide` must invoke the same canonical ApprovalService as REST, checking token, exact text/hash/recipient/version/expiry/run and handling repeated calls idempotently. This module does not own approval persistence or sending.

The renderer's supplied async `respond` first POSTs to `/api/projects/:p/checkpoints/:toolCallId/resume` with the bounded ApprovalDecisionInput. That authenticated bridge checks CSRF, identity/version/expiry and awaits the canonical decision handler. Only after a committed response does it resolve the actual CopilotKit hook. The SDK's subsequent automatic agent continuation is read-only, so one click does not call a second approval path. An unavailable decision handler returns NOT_READY. Pending identities reload from PostgreSQL; expired decisions show a fresh-review message. Full approval-to-send acceptance remains for Stages 5/6.

A focused check found that replaying TOOL_CALL_ARGS for an existing logical ID concatenates JSON in the pinned SDK. The bridge now skips IDs already in incoming SDK history, while new/reloaded clients receive the same persisted IDs. The regression assertion verifies every repeated tool's arguments remain valid JSON. Unknown browser/model messages cannot choose server identity or cause a provider operation.

## Verification

- Scoped server and web typechecks passed against exact pinned SDK imports.
- Scoped server and web builds passed. The shared app still needs the registration above, so its build does not claim a completed live browser journey.
- `TEST_DATABASE_URL=<local isolated database> pnpm exec tsx packages/server/src/modules/live/live-check.ts` passed. This explicit local check is outside default tests and uses runtime's unique-schema fixture, cleaning up afterward. It verifies unauthenticated and foreign-project rejection, worker document denial, authorized evidence read, two authenticated HttpAgent clients receiving the same committed version, real SiteService completion producing 81%, stale-cursor snapshot recovery, pending checkpoint reload through a new service instance, and NOT_READY for unregistered approval. No provider call or fabricated approval success occurs.
- Two-browser visual inspection and human pending-decision callback are not claimed for Stage 3. Chrome extension UI interrupted the prior stage's browser session. Integrated visual checks remain for the shared stage check; the two-client verification above is protocol evidence, not two browser windows.
- No new test suite, provider probes or broad journey were run. A bounded live-check executable records the serious replay fix. Credential-dependent live acceptance remains pending per the user override.

No new configuration names. Existing DATABASE_URL, PUBLIC_BASE_URL and session settings apply. TEST_DATABASE_URL opts into the explicit local probe. Source docs rechecked: https://docs.copilotkit.ai/reference/hooks/useAgent, https://docs.copilotkit.ai/reference/hooks/useHumanInTheLoop, https://docs.copilotkit.ai/reference/hooks/useRenderToolCall, https://docs.ag-ui.com/concepts/events. Installed declarations verified selfManagedAgents, useRenderTool parameters and the SDK callback lifecycle. No dependency versions changed; the shared owner added explicit already-pinned dependency declarations.
