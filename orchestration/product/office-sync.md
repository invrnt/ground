# Ambiguous office synchronization

Owner: `office-sync`. Requirement: RF27. Report content comes from reporting's RF16 contract.

Maintain a one-way projection into the configured Ambiguous workspace:

| App | Required result |
| --- | --- |
| Drive | Original photo uploaded once per logical attachment/run, linked to hash, message and issue |
| Tasks | `Revisar fuga · Baño 2 · pared norte`, assigned to Juan, due at the resolved time, with description and evidence link |
| Docs | One report document per project, scenario run and local date; progress, consumption, issue, assignee, replenishment, request outcome and source links |

Upload the photo before attaching its remote link to the task. Later photos or due-date changes update the existing task. Coalesce pending report updates to the latest committed ReportSnapshot. After a request is sent, update the same day's document and keep its URL stable.

Persist `provider`, `local_id`, `remote_id`, `remote_url`, `synced_version`, `sync_status` and redacted `last_error`. A successful write is verified by reading the remote resource. Preserve matching run and operation markers where the provider supports them.

On ambiguous creation outcome, reconcile by stored remote ID or verified searchable marker before retrying. If the API cannot support lookup, enter manual review. Never blindly recreate a remote file, task or document. Failed synchronization leaves the local project committed and visibly pending.

If Juan's remote mapping or supported assignment fields are missing, show `needs_configuration`, with Ana responsible for resolution. A complete demo requires Juan and due time visible remotely; an unassigned placeholder does not pass.

Manage only Ground's named document section. Preserve human content outside it. Verify safe update semantics; if the provider only supports whole-document replacement, use a dedicated Ground document and read/merge content with conflict detection. Do not erase human edits to simulate synchronization.

Previous runs' objects are archived only when the demo workspace supports a safe scoped operation; otherwise separate them by run labels/folders. Never delete unrelated workspace content. Sheets, CRM, Calendar, Mail and reverse synchronization are excluded.
