# Ground endpoint map

Assumption: these are the canonical Ground routes. All project routes require a session and project membership. All mutations use CSRF/origin protection and an `Idempotency-Key` except provider webhooks, which use provider identity. Body and response schemas live in contracts. Path identity always overrides an untrusted body identity.

| Method and route | Body/query -> response | Handler owner / authorization |
| --- | --- | --- |
| `GET /health/live` | none -> process status | runtime; public, no secrets |
| `GET /health/ready` | none -> DB/worker readiness summary | runtime; public minimal status |
| `POST /api/session` | username/password -> user/roles, secure session cookie | runtime; rate limited |
| `GET /api/session` | none -> current user/roles | runtime; authenticated |
| `DELETE /api/session` | none -> 204, revoke session | runtime; authenticated |
| `POST /webhooks/telegram` | Telegram update -> 200 once persisted | telegram-intake; webhook secret and binding |
| `GET /api/projects/:p/snapshot` | none -> ProjectSnapshot | live-workspace; role-filtered |
| `POST /api/projects/:p/agent/run` | pinned AG-UI input -> AG-UI stream | live-workspace; authenticated bound project/thread |
| `POST /api/copilotkit` | pinned SDK runtime protocol -> runtime response/stream | live-workspace; authenticated, delegates to same agent/checkpoint services |
| `GET /api/projects/:p/events` | `after` cursor -> authorized AG-UI event replay/live stream | live-workspace; no raw unrestricted events |
| `GET /api/projects/:p/evidence/:id` | none -> source author/message/operations/attachment metadata | live-workspace |
| `GET /api/projects/:p/files/:id` | none -> private original bytes | runtime; resource-level access |
| `POST /api/projects/:p/clarifications/:id/answer` | answer/selection, token, expected version -> OperationResult | interpretation; permitted respondent |
| `POST /api/projects/:p/operations` | allowed OperationProposal -> OperationResult | site-domain; typed handler delegation and command-level permissions |
| `POST /api/projects/:p/operations/:id/corrections` | corrected fields/reason/version -> OperationResult | site-domain; self-report or supervisor |
| `POST /api/projects/:p/queries` | text -> answer, version, evidence references | reporting; restricted fields filtered |
| `GET /api/projects/:p/purchases` | cursor -> purchase summaries | purchases; authorized cost access |
| `POST /api/projects/:p/purchases` | validated invoice proposal -> purchase/result | purchases; record permission |
| `POST /api/projects/:p/purchases/:id/receipts` | quantities/evidence/version -> receipt/result | purchases; receipt permission |
| `GET /api/projects/:p/needs/:id` | none -> need/calculations/candidates/source references | sourcing; cost fields restricted |
| `POST /api/projects/:p/needs/:id/research` | expected need version -> job ID/status | sourcing; configured research permission |
| `POST /api/projects/:p/proposals` | need/version/candidate or specification -> RequestProposal | procurement; supervisor or purchasing |
| `GET /api/projects/:p/proposals/:id` | optional version -> authorized exact proposal | procurement |
| `PATCH /api/projects/:p/proposals/:id` | expected version and allowed edits -> new immutable version | procurement; supervisor or purchasing |
| `POST /api/projects/:p/proposals/:id/decisions` | ApprovalDecisionInput -> persisted decision/request ID | procurement; supervisor; same handler as SDK resume |
| `GET /api/projects/:p/requests/:id` | none -> request, replies, follow-up | dispatch; authorized operational view |
| `POST /api/projects/:p/requests/:id/reconcile` | observed outcome, evidence, expected state -> updated request | dispatch; admin/supervisor, audited |
| `GET /api/projects/:p/reports/:date` | optional version -> ReportSnapshot/HTML | reporting; role-filtered |
| `GET /api/projects/:p/reports/:date.pdf` | exact version -> PDF bytes | reporting; role-filtered |
| `GET /api/projects/:p/operations/status` | none -> health/pending jobs/costs/remote states | operations; admin |
| `POST /api/projects/:p/jobs/:id/retry` | expected state, reason -> job state | operations; admin and retry policy |
| `POST /api/projects/:p/runs/:id/reset` | expected run, confirmation -> new run ID | operations; admin only |
| `GET /api/projects/:p/runs/:id/export` | none -> RunExport download | operations; admin only |

A successful async action returns 202 with a persisted operation/job ID. Reads and completed actions return 200; creation may use 201. The report route returns its DTO for `Accept: application/json` and HTML for `Accept: text/html`; PDF requests name the exact snapshot version. Error shape is in [errors](errors.md). Cursor reads have bounded page sizes. Server-sent event transport details follow the pinned SDK adapter selected in Stage 1; no domain endpoint should depend on browser lifecycle.

Administrative provisioning is a CLI calling the same project service, not an unauthenticated HTTP setup endpoint. The two CopilotKit/AG-UI routes are protocol boundaries, not separate state or approval implementations.
