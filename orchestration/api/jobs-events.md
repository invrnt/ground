# Events, checkpoints and durable jobs

## Event envelope

Every event has `event_id`, project/run IDs, monotonically increasing project `sequence`, `project_version`, `operation_id`, `type`, `occurred_at`, `schema_version`, `evidence_ids` and a typed payload. Assign sequence under the same project lock as the state transaction. Store before emitting. Filter payloads by role before transport.

| Event family | Owner | Consumers |
| --- | --- | --- |
| `input.received`, `attachment.linked` | telegram-intake | interpretation, office-sync, live |
| `interpretation.completed`, `clarification.required/resolved`, `input.failed` | interpretation | site/purchases/reporting, live |
| `work.updated`, `inventory.changed`, `issue.updated`, `assignment.updated`, `need.changed`, `operation.corrected` | site-domain | sourcing, reporting, procurement, office-sync, live |
| `purchase.recorded`, `receipt.confirmed` | purchases | reporting, live; stock change comes from inventory service |
| `research.started/completed/failed` | sourcing | procurement, reporting, live |
| `proposal.created/changed/invalidated`, `approval.recorded` | procurement | dispatch, reporting, live |
| `request.sending/sent/uncertain/failed`, `request.reply_received`, `followup.updated` | dispatch | reporting, office-sync, live |
| `remote.sync_pending/synced/failed` | office-sync | live, reporting metadata |
| `run.resetting/started`, `job.updated` | operations | workers and live |

Do not create an infinite report-sync loop: a remote link update changes sync metadata without scheduling an identical report content version. Coalesce content changes by latest project version.

## Job envelope

`job_id`, kind, project/run/operation IDs, dedupe key, payload version, status, attempts, available/due time, lease owner/expiry, last error, condition and result reference. Store the minimal IDs and expected versions, not mutable free-form model instructions.

| Kind | Dedupe key scope | Handler owner |
| --- | --- | --- |
| `process_input` | provider + update ID | interpretation |
| `send_channel_reply` | logical reply ID | telegram-intake |
| `research_need` | run + need ID + need version | sourcing |
| `sync_attachment` | run + attachment ID + content hash | office-sync |
| `sync_assignment` | run + assignment ID + desired version | office-sync |
| `sync_report` | run + project + report date; coalesce desired version | office-sync |
| `dispatch_request` | run + proposal ID + approved version | dispatch |
| `follow_up` | run + subject ID + follow-up policy/version | dispatch |

Infrastructure owns enqueue, transactional outbox insertion, claiming, retry scheduling and leases. Modules own job meaning. Claim pending work with row locks and `SKIP LOCKED`, commit the lease, then call a provider. Persist the normalized outcome afterward. A crashed leased write becomes an uncertain outcome if the effect may have started.

Assumption: known-safe retries use 2 s, 10 s and 30 s with jitter, honor provider retry-after and stop after three retry attempts. Keep the failure visible for authorized manual recovery. Read timeouts are bounded; Exa uses 20 s. Work leases must exceed the call timeout or be renewed safely.

## Approval checkpoint

Persist checkpoint ID, agent/thread/run IDs, tool-call ID, proposal ID/version, expected hash, expiry and decision status before showing the decision. Replaying an unresolved checkpoint reuses its logical ID. Frontend callbacks cannot create a new authorization just by replaying AG-UI events.

An approval transaction locks the proposal and active scenario, verifies session/role/token/version/hash, records the decision and creates one dispatch outbox row. The worker locks again to claim the immutable payload. A changed input before that claim invalidates approval. A change after a send claim requires a separately approved amendment and preserves the original send history.

## Reset fencing

New claims must verify active run under the scenario lock. Reset marks the run resetting before cancelling pending work. Already-started provider calls cannot be undone; settle or mark them uncertain and prevent the next clean rehearsal until reconciled. Once safe, retire the old run and activate the new seed. Old callbacks, delayed updates and follow-up jobs remain fenced out.
