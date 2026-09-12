# Ambiguous adapter and capability gate

The supplied [Ambiguous API reference](https://www.ambiguous.ai/agents/api) could not be retrieved during authoring on 2026-09-12. The PRD states Bearer authentication and document, task and upload endpoints. Their exact methods, paths, request fields and account permissions are not verified. Do not treat the local names below as external endpoints.

## Stable local port

| Method | Input | Required normalized output |
| --- | --- | --- |
| `checkCapabilities` | configured workspace and user mapping | supported upload/read, task assignment/due date, document read/update and reconciliation capabilities |
| `uploadEvidence` | original bytes, filename/type, content hash, run/operation marker | remote ID and URL |
| `getFile` | remote ID | verified ID and accessible file metadata/content reference |
| `createTask` | title, description, mapped user ID, UTC due time, evidence URL, marker | remote ID and URL |
| `updateTask` | remote ID, desired version and allowed assignment fields | remote ID and revision if available |
| `getTask` | remote ID | title, assignee, due time and evidence sufficient for read-back |
| `createDocument` | project/run/date title, managed report section, marker | remote ID and URL |
| `updateDocument` | remote ID, observed revision, managed content | resulting revision if supported |
| `getDocument` | remote ID | content and revision for verification/preservation |
| `findByMarker` | resource kind and stable marker | unique match, no match, ambiguous or unsupported |

## Required discovery

Stage 1 fetches current authenticated account docs and records exact HTTP methods/paths, required fields, content format, file upload flow, supported assignment IDs, due-date timezone semantics, pagination/search filters, idempotency/revision support and safe document update rules. Store redacted findings in the foundation handoff. The shared owner updates this contract with verified mappings, including source URL/date. Never store a token or private response dump.

Perform one scoped demo upload, task creation with Juan and due date, document creation/update and read-back when access is available. These are internal demo writes under the configured project policy. Retain the resulting IDs for cleanup rather than creating new probes repeatedly. Missing account credentials may postpone this live check, but office-sync cannot pass its real acceptance until it succeeds.

If lookup/idempotency is unsupported, return `unsupported` explicitly and route uncertain creates to manual review. If assignment is unsupported, mark configuration incomplete; do not invent a body field. If updates cannot preserve human content, use a dedicated managed document with read/merge protection and record the limitation.

Sync ownership, coalescing, object identities and reset behavior are in [office-sync](../product/office-sync.md). Ground stays authoritative; this adapter only projects typed state.
