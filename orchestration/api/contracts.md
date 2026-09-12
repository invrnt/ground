# Shared contracts

Stage 1 encodes these contracts once in `packages/contracts/src/` with runtime schemas and inferred TypeScript types. The stage's shared owner alone changes them. Fields below are Ground's design, not claims about third-party API schemas.

## Common values

IDs are opaque UUID strings. Dates are `YYYY-MM-DD`; timestamps are UTC ISO-8601. `Decimal` is an exact decimal string, including money in COP and area/coverage. Counts of whole boxes/bags are integers. `ActorContext` is server-created: `actor_id`, `project_id`, `run_id`, roles, permissions and trusted time. Never accept it from model output or trust it from a browser body.

`OperationResult` has `operation_id`, `status`, `event_ids`, `state_diff`, `pending_actions`, `project_version`, `evidence_ids`. Status is `applied`, `already_applied`, `needs_input`, `rejected` or `conflict`. A state diff contains entity type/ID and validated before/after fields. Pending actions have ID, kind, status and a safe route.

## Commands

`OperationProposal` has `type`, `entity_ids`, `fields`, `evidence_ids`, `expected_version`. The expected version is the project version from the context used to propose the command. An execution envelope adds trusted context, source message ID and an idempotency key. Reject extra fields and unknown command names.

| Type | Required fields or references | Handler owner |
| --- | --- | --- |
| `complete_work_item` | work item ID | site-domain |
| `consume_material` | material, location, positive quantity, unit | site-domain |
| `report_issue` | location, description, observed condition | site-domain |
| `assign_review` | issue, assignee, UTC due time, blocking work item | site-domain |
| `update_assignment` | assignment, permitted status/due-time fields | site-domain |
| `resolve_issue` | issue, resolution note and evidence | site-domain |
| `correct_operation` | original operation ID, corrected quantity or supported field, reason | site-domain |
| `register_purchase` | issuer/reference if known, lines, currency, document hash | purchases |
| `confirm_receipt` | purchase, line quantities, receipt evidence | purchases |

Independent proposals may have separate results. Atomic related operations use one validated command group and transaction; make this grouping explicit before execution. Reuse source operation keys when reinterpreting a late attachment or retrying an input.

## Principal DTOs

| DTO | Required shape |
| --- | --- |
| `ProjectSnapshot` | project/run ID, scenario version/date, project version, event cursor, visible members/locations/work/stock/issues/tasks/needs, proposals, requests, decisions, remote links |
| `NormalizedMessage` | provider/update/chat/message/sender IDs, text, timestamps, reply target, media descriptors, trusted project/run binding |
| `InterpretationResult` | transcript reference, proposed operations, missing fields, query intent or irrelevant flag, model/schema versions |
| `Clarification` | pending operation IDs, report/thread, question/options, allowed respondent scope, expected version, expiry, token hash, answer/result |
| `ProcurementNeed` | material, activity, required date, area/allowance, usable and committed stock, net quantity, version, evidence IDs |
| `SupplierCandidate` | id, query ID, source URL, fetched time, merchant/product/reference/specification, compatibility status, sale unit, coverage, published price/currency, delivery statement, evidence by field |
| `CandidateCalculation` | candidate/need versions, required boxes, unit price basis, converted price if valid, material subtotal, known transport/tax, known total or null, unresolved fields |
| `RequestProposal` | id, immutable version, need/candidate versions, selected specification, calculation snapshot, recipient ID, address, desired date, exact text, content hash, status, expiry, checkpoint ID |
| `ApprovalDecisionInput` | proposal ID/version, `approve` or `reject`, checkpoint token; trusted actor/time added on server |
| `ApprovalDecision` | decision ID, proposal ID/version, actor ID, decided time, decision, content hash, recipient ID, run ID |
| `OutboundRequest` | request/proposal/version/approval IDs, immutable payload, recipient, status, provider message ID if known, attempt and uncertainty timestamps |
| `ExternalObjectLink` | provider, local ID, object kind, project/run, remote ID/URL, synced version, sync status, last error |
| `ReportSnapshot` | report ID, project/run/date/version, generated time, authorized report sections, evidence/source/request/link references |
| `RunExport` | run/scenario/code versions, model/SDK versions, inputs, operations, events, sources, approvals, requests, jobs, remote links and redacted provider calls |

Nullable candidate facts remain null. `evidence_by_field` maps each claimed fact to source snapshot ID and supporting excerpt; calculated values instead name inputs and formula. Excerpts cannot override tool instructions.

## Internal ports

Declare typed ports for `ProjectRepository`, `TransactionRunner`, `PrivateFileStore`, `JobQueue`, `InventoryService`, `SiteCommandService`, `InterpretationService`, `ClarificationService`, `ResearchService`, `ReportService`, `ApprovalService`, `DispatchService`, `WorkspaceSyncService`, `LiveStateService` and one adapter per provider. Implement only needed methods. Ports pass the transaction context explicitly when an operation must share a commit.

The fixed agent tool names are `get_project_context`, `get_inventory`, `get_work_plan`, `list_open_issues`, `get_evidence`, `propose_operation`, `request_clarification`, `prepare_procurement_request`, `apply_validated_operation`, `correct_operation`, `generate_site_report`, `search_supplier_pages`, `extract_supplier_candidate`, `enqueue_workspace_sync`, `request_approval`, `dispatch_approved_request`, `schedule_followup`. Reads filter by context. Effect tools call validated server handlers; the model cannot directly invoke arbitrary provider requests.

For future modules, Stage 1 declares contracts and unavailable registration slots. A disabled slot returns `NOT_READY`, never fake domain success. The stage owner replaces the slot only after its module merges.
