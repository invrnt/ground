# CopilotKit and AG-UI contract

Official references retrieved on 2026-09-12: [AG-UI overview](https://docs.copilotkit.ai/ag-ui/introduction), [useAgent](https://docs.copilotkit.ai/reference/hooks/useAgent), [useHumanInTheLoop](https://docs.copilotkit.ai/reference/hooks/useHumanInTheLoop) and [AG-UI events](https://docs.ag-ui.com/concepts/events). Current hook examples use the React v2 API. Pin a compatible SDK/runtime/protocol set and verify imports against that set.

`useAgent` provides reactive access to the configured agent. `useHumanInTheLoop` supplies the response callback while waiting for human input. Its browser promise is not durable storage. Ground's backend checkpoint remains authoritative across reloads. See [useAgent](https://docs.copilotkit.ai/reference/hooks/useAgent) and [human interaction](https://docs.copilotkit.ai/reference/hooks/useHumanInTheLoop).

## Local adapter contract

Map each project/run to a stable authenticated AG-UI thread. Transform persisted snapshots and domain events into SDK-recognized state, tool-call and result events. Retain a cursor for replay, and assign stable IDs to logical tool activities. Never replay a historical activity as a fresh side effect.

Register StateChangeCard, IssueCard, SupplierComparisonCard and ProcurementApprovalCard through the real SDK. The live owner supplies registration slots; feature owners supply their cards. The shared owner wires them once.

The approval callback submits the bounded decision to the runtime bridge, which invokes the same `ApprovalService` as the REST recovery endpoint. It validates, commits and returns the persisted decision/request ID before the SDK considers the tool finished. Do not call both paths for one click. Dedupe remains mandatory if a browser resubmits.

Reconnecting loads a consistent ProjectSnapshot and its event cursor, then replays newer events. Restore unresolved checkpoints from persistence with their original logical IDs and current expiry/version. A stale checkpoint must display a fresh-review state and cannot resume an old send.

## Stage 1 feasibility exit

Pin and demonstrate one server-originated state event and one human response reaching a backend handler, including reload recovery of a stored sample checkpoint. Keep the probe isolated under foundation's probe paths and replace its registration with production modules in Stage 3. This validates SDK compatibility, not procurement authorization. Do not fake CopilotKit with custom buttons that bypass its interaction mechanism.
