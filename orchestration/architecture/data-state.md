# Data and state

## Stored records

Use relational columns for keys, versions, statuses, monetary values and fields queried by the application. JSONB may hold validated extraction payloads, event diffs and source field evidence. No generic entity store.

| Entity family | Records and important constraints |
| --- | --- |
| Context | Workspace, Project, ChannelBinding, MemberRole, RemoteUserMapping, Location, Material, UnitConversion; unique channel binding and scoped identity mappings |
| Input | InboundMessage, Attachment, EvidenceRef, AgentRun, Clarification; unique provider update and message keys; attachments preserve actual author and reply target |
| Work | WorkItem, Dependency, Issue, Assignment; unique source operation effect; work weights total 100 for the scenario |
| Stock | InventoryMovement, Purchase, Receipt; append-only signed quantities; unique operation key; one logical invoice and receipt |
| Procurement | ProcurementNeed, SupplierCandidate, SourceSnapshot, Quote, RequestProposal, Approval, OutboundRequest; immutable proposal versions and source snapshots |
| Delivery | DomainEvent, InboxEntry, OutboxEntry, ScheduledJob, ExternalObjectLink; unique dedupe keys and leased jobs |
| Support | Session, ReportSnapshot, ScenarioRun, ProviderCall; session hashes, immutable report versions, run lifecycle and redacted call metadata |

All operational records carry `project_id` and `run_id`. `ScenarioRun` records `scenario_version`, scenario date and `active`, `resetting` or `retired`. Reusable context belongs to the project; run-specific values and mappings must not accidentally reuse prior effects.

Use UUIDs for local IDs, UTC ISO timestamps over HTTP, `timestamptz` in PostgreSQL, and explicit integer versions. Wire monetary and area decimals are decimal strings. Persist exact PostgreSQL numeric values. Use fixed-point or one decimal library in domain; never binary floating point to decide a ceiling or total.

## Transactions and concurrency

1. Resolve identity and project from trusted server context.
2. Deduplicate by operation key; return the prior result if already committed.
3. Lock the active scenario row, then relevant project/entity rows in a stable order. Validate `expected_version` and available stock.
4. Apply one indivisible operation, increment project and touched entity versions, append evidence, event and outbox records.
5. Commit, then publish/replay events. No UI `applied` state before commit.

Project-level serialization is acceptable for one five-user demo. A version conflict returns `VERSION_CONFLICT` and fresh data; re-evaluate before retry. Never silently retry an outdated quantity or approval.

Input dedupe keys retain provider identity across resets. Replay of an old Telegram webhook stays attached to its old run and cannot recreate effects in the new run. New scenario reports require new message IDs.

## State machines

- Activity: `processing`, `applied`, `needs_input`, `sync_pending`, `synced`, `failed`.
- Issue: `open`, `in_review`, `resolved`. Assignment: `open`, `scheduled`, `completed`, `blocked`.
- Proposal: `draft`, `awaiting_approval`, `approved`, `rejected`, `invalidated`, `expired`.
- Outbound request: `queued`, `sending`, `sent`, `send_uncertain`, `failed`, `cancelled`. Supplier reply is a separate record.
- Job: `pending`, `leased`, `succeeded`, `retry_wait`, `cancelled`, `needs_review`, `failed`.
- Remote link: `sync_pending`, `syncing`, `synced`, `needs_configuration`, `reconciling`, `failed`.

Activity state never replaces domain state. A local assignment can be scheduled and still have `sync_pending` on its remote link.

## Read models and browser state

`ProjectSnapshot` contains a version, event cursor, visible work and stock, issues, needs, requests, pending decisions and link states. Filter restricted fields before serialization. Fetch snapshot and cursor from the same consistent database view. Replay events strictly after that cursor. A gap or expired cursor triggers a fresh snapshot.

One CopilotKit/AG-UI state adapter owns project server state. React component state holds only open panels, filters and unfinished forms. Do not store project balances or approvals in localStorage or a second global store.

Reports are immutable snapshots by project, scenario run, local report date and project version. HTML, PDF and the managed Ambiguous document section receive the same report DTO. New state produces a new version; synchronization records which version is remote.
