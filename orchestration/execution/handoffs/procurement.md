# Procurement handoff

Stage 4 base `f574781`; shared Stage 5 checkpoint `73f9539` provides proposal/approval/outbound and office persistence. Contribution is the commit containing this handoff. Peer registration and combined gate remain pending.

Implemented immutable proposal versions with exact Spanish RFQ text, signed material/quantity/calculation/destination/date, source evidence and explicitly labeled Demo recipient. The configured reachable recipient and test address are the only allowed destination. Missing destination or a SESSION_SECRET shorter than 32 characters fails visibly. Tokens derive from HMAC and persist only as hashes; the same secret restores the token after reload without storing plaintext tokens.

One ApprovalService validates actual current member roles, active run, proposal/checkpoint identity, expiry, exact payload hash, current need/candidate facts and configured destination. Worker and purchasing-only roles cannot approve. Repeated identical decisions return the stored approval; conflicting decisions fail. Approval, one pending outbound request, dispatch job and transactional outbox commit together. No sender or Sent state is implemented in this stage.

Change creates a new version and invalidates unclaimed authorization. Alternative materials require an explicit supervisor review. Reject persists the decision without an outbound request. Need-change injection invalidates pending/approved-but-unclaimed work inside the domain transaction. Config/source changes are rechecked at approval and by bounded poll. After a send claim, immutable outbound history remains intact and an amendment intent is recorded instead of rewriting its content. Repeated poll does not emit another amendment event for the same intent.

## Canonical integration ports

- `ProcurementService({transactions,projects,queue,sourcing,checkpoints,secret,clock?})`, `procurementModule(service,sessions)`. `create`, `change`, `get`, `options` and `decide` back canonical REST routes. Mutation keys bind the actor and input.
- `arguments(context,checkpoint)` supplies `{view}` to the existing live DecisionTransport. `decide` is the sole ApprovalService used by REST and the actual CopilotKit callback.
- `changed(input,tx)` implements the site's invalidation port. Inject through composition before later site commands execute.
- `authorizedDispatch(context,id,version,tx)` is Stage 6's pre-claim validation port. It locks the active scope and pending outbound row, checks the stored supervisor approval/checkpoint and exact text/recipient/current selection. Dispatch must call it and mark its send claim in that same transaction before any provider call. It does not send or claim by itself.
- Sourcing's existing selection port now accepts an optional transaction and validates current persisted candidate/calculation facts. The grant preserves one selection implementation.
- Canonical project snapshot includes role-filtered latest proposals, outbound states and decisions. Its optional scoped office-links reader supports the office owner's SQL without recursion.
- Live's existing resume bridge delegates already-approved/rejected checkpoints to the same idempotent service; stale/invalidated/expired pending identities remain denied.
- `ProcurementApprovalCard` takes DecisionRendererProps plus session-derived `projectId` and `csrfToken`. Its Approve/Reject use the hook-supplied respond callback. Root wraps it as the decision slot. `ProcurementPanel({projectId,csrfToken})` supplies preparation and Change forms in the existing supplier slot. No second SDK state or browser domain calculation exists.

## Checks

TDD first failed on the missing service. The isolated PostgreSQL critical case then found a PostgreSQL date-to-wire conversion issue, which was fixed with explicit date formatting. Final focused case passed worker/foreign denial, expiry, repeat approval and one dispatch job, candidate price and configured recipient changes, stale quantity cancellation, authorized pre-claim read, Change/Reject, restored token after service recreation and amendment preservation after simulated send claim. These are database/protocol observations, not an external message send. Scoped server and web typechecks passed.

Inspected a clearly labeled synthetic approval-card preview in Chrome: full Spanish text, Demo recipient, test address, unknown total and actions were readable. Change expanded its request-detail boundary; its preview had no authenticated API, so the live editor fetch was not claimed successful. Reject's component callback displayed rejection feedback. Real Change/Reject and reload persistence were exercised by the database case. Temporary preview files/process/tab were removed. No full authenticated browser approval journey or external send is claimed before the shared release session.

## Versions and configuration

Reused Node crypto HMAC-SHA256/timing-safe token comparison, existing schemas, exact domain money functions and pinned CopilotKit/AG-UI APIs. No dependency upgrades or new provider APIs. Uses existing SESSION_SECRET and configured demo manifest fields, with no credentials recorded. Narrow grants for the canonical snapshot, sourcing selection and live resume bridge are recorded in ownership.md. FEEDBACK.md absent; parent reported no PR feedback. Office live resource checks remain pending account credentials per the user's timing override.
