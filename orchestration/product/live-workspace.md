# Live workspace and evidence

Owner: `live-workspace`. Requirements: RF08, RF21, RF22, RF25.

Show La Arboleda, scenario date, author, bathroom progress, material balances, issues, assigned work and needs. Two authenticated browsers see the same committed version. Loading, empty, disconnected, forbidden and recoverable failure states have useful text.

X-Ray is an activity list tied to an inbound report and its run. A card shows source, operation, before/after values, time, status, tool/provider, result and any remote resource link. The activity states are `processing`, `applied`, `needs_input`, `sync_pending`, `synced` and `failed`. Expose technical details on expansion. Do not display hidden reasoning.

Implement StateChangeCard and IssueCard. Register sourcing's SupplierComparisonCard and procurement's ProcurementApprovalCard through the shared composition owner. The original message, author, timestamp, transcript, attachment and applied or compensating operation must be navigable through authenticated evidence routes.

Use actual CopilotKit and AG-UI for state, tool rendering and human interaction. Maintain one project state adapter. Backend event replay supplies committed snapshots and pending decisions. A browser reload restores an approval checkpoint and can resume it from the real CopilotKit callback. Closing the browser does not cancel backend jobs or lose a proposal.

The live-workspace agent owns the checkpoint transport and SDK behavior. Procurement owns validation and persistence of the decision; dispatch owns its external effect. RF25 is accepted end to end after those modules are merged. An isolated SDK card is only an intermediate milestone.

Restricted data must already be absent from the server DTO for workers. Public source links, source timestamps and verified remote links stay visible where authorized. An assignment can say `Scheduled` locally and `Sync pending` remotely. Display the Ground version and remote synced version when they differ.
