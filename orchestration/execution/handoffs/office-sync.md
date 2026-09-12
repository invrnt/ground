# Office sync handoff

Stage 5 base `f574781`; merged shared checkpoint `73f9539`. Contribution commit is the commit containing this handoff. Edited only the Ambiguous adapter, workspace-sync module and this handoff. FEEDBACK.md absent; Orchestrator reported no PR feedback.

Implemented the real Ambiguous REST adapter from the public OpenAPI contract, plus durable file/task/report synchronization. Photo bytes remain original, uploads carry a stable run/file marker in the filename, and read-back verifies MIME, length and SHA-256 through the documented content endpoint. Task writes use mapped workspace users, the native due date, visible UTC and Bogotá time in the description, source/evidence links, and read-back checks. Late photos wake related assignment synchronization; the same task identity is updated.

One document identity per run/project/date consumes the persisted financial ReportSnapshot without recomputing reporting data. Initial content is a dedicated marked block. Updates use documented block-targeted operations after reading the current revision and locating the managed block. They never send a whole-document replacement. Human content outside that block stays outside the patch. If the returned content has no usable managed block ID, the adapter fails closed for manual review.

Office object rows persist identity/marker, desired hash/version, lease, remote ID/revision/URL, verified version and redacted status/error. The coordinator saves remote identity before verification. An expired or uncertain create uses its stored ID or a bounded paginated marker lookup. Only a unique verified object completes reconciliation. None, ambiguous or unsupported lookup requires manual review; no blind second create occurs. A stale concurrent claim cannot start another create after a peer updates the row. Local domain state is never changed by synchronization.

`remote.sync_pending`, `remote.synced` and `remote.failed` expose observable status without changing project content version or creating a report-sync loop. Link reads authorize membership and active run directly, with run-then-project SHARE locks; they do not call the snapshot reader. Financial document links and restricted file links are omitted for workers. Objects without a real remote ID/URL are represented by status/events, never invented links.

## Actual API contract retrieved

The previously unavailable documentation is now accessible with an ordinary HTTPS fetch. [Public OpenAPI](https://app.ambiguous.ai/api/openapi.json), linked by the official [recipes page](https://www.ambiguous.ai/agents/recipes), retrieved 2026-09-12. Spec version `1195179a5535748e4ffe53978d2fc5082ec09f1c`; downloaded spec SHA-256 `98597b2f041f95db38b9404ac615fb1092b912cd217796e85f7b6efc5ef3ecde`. No authenticated account response or token was used.

Verified mappings:

- Bearer authentication, `API-Version: 1`, production origin `https://app.ambiguous.ai`. `GET /api/users/me` binds the configured workspace; `GET /api/users?limit=100` checks mapped assignee membership before writes.
- `POST /api/drive/upload-proxy`, multipart `file`, returns DriveFile. `GET /api/drive/:id` reads metadata; `GET /api/drive/:id/content` returns original bytes. This avoids speculative presigned-upload handling. `GET /api/drive?q=...` has cursor pagination and supports filename marker lookup.
- `POST /api/tasks`, `GET/PATCH /api/tasks/:id`, wrapped `{ task }`. Actual fields are assignee_id, due_date, description, title and status. `GET /api/tasks?q=...` searches title/description with pagination.
- `POST /api/documents` accepts type doc, Markdown content, title and labels. `GET/PATCH /api/documents/:id` returns a DocumentEnvelope with ProseMirror JSON content and updated_at. PATCH supports `operations: [{ type: replace, blockId, content }]`. `GET /api/documents` supports cursor pagination; stable label markers distinguish Ground documents.

The native task due_date is date-only. Exact 09:00 Bogotá is visible in the managed description and checked alongside the date; this is not a claim of native timestamp scheduling. The API exposes no documented document compare-and-swap header. A reread checks updated_at and the patch targets only Ground's block. The actual account's returned ProseMirror `attrs.blockId` availability and round-trip shape must be verified during the live chain; absence remains NOT_READY/manual review, not permission for full-body replacement.

## Integration exports

- `AmbiguousClient({ token, workspace_id, base_url? })` implements the frozen AmbiguousAdapter plus file-integrity/user checks and supported task update metadata. Configuration uses existing AMBIGUOUS_API_TOKEN, AMBIGUOUS_WORKSPACE_ID and optional AMBIGUOUS_BASE_URL.
- `OfficeRepository(transactions)` owns office persistence and safe link reads.
- `OfficeSyncService({ repository, adapter, files, queue, public_base_url })`; `workspaceSyncModule(service)` exports sync_attachment, sync_assignment and sync_report handlers. PUBLIC_BASE_URL supplies authenticated Ground evidence links.
- `office.links(context, tx?)` is injected into the canonical snapshot and reporting supplements. No recursion through ProjectRepository.
- With missing token/workspace, keep provider jobs unclaimed in a configuration-pending module, matching the existing interpretation setup. User mapping is stored in members.remote_user_id. Missing mapping leaves an explicit failed office object/event and supervisor configuration message.
- sync_report subjects are the persisted report UUID supplied by reporting's single coalescing scheduler. A document's stable identity uses its date, so later versions preserve its remote URL.

## Checks and pending acceptance

The critical file was written first and failed on the missing repository/coordinator. After implementation, `TEST_DATABASE_URL=<isolated local connection> pnpm exec vitest run packages/server/src/modules/workspace-sync/workspace-sync.critical.test.ts` passed both cases. The PostgreSQL case simulates a create timeout, reconstructs the coordinator, reconciles a unique object with one create, and separately leaves unsupported lookup in needs_review without another create. The fixture schema is dropped afterward. The second case verifies a document update request contains only the managed block operation, not human content or a top-level content replacement.

`pnpm --filter @ground/server typecheck` passed. No broad suite, extra service probe, merchant contact or remote write ran. All provider responses in tests are declared fixtures. Real Drive/Tasks/Docs create/update/read-back, Juan membership, time-description visibility, returned block identity and actual workspace permissions remain pending credentials. RF27 live acceptance is not claimed; the user's credential timing override permits implementation progression.

No dependencies, model settings or new configuration names added. Reused Zod 3.25.76, pg 8.23.0, TypeScript 5.9.3 and Node fetch/FormData. Shared owner owns migrations 010, composition and snapshot link injection. Previous public-doc failures are superseded by the retrieved OpenAPI contract above; account-specific acceptance remains pending.
