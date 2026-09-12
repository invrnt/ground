# Live workspace agent

## Mission

Present committed project state and evidence through a real, recoverable CopilotKit/AG-UI workspace.

## First Read

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../README.md)
- [system-overview.md](../../architecture/system-overview.md)
- [contracts.md](../../api/contracts.md)
- [ownership.md](../ownership.md)
- [strategy.md](../../testing/strategy.md)
- Root `FEEDBACK.md`, if present; check the primary checkout through the Orchestrator for uncommitted updates.
- [product/live-workspace.md](../../product/live-workspace.md)
- [architecture/data-state.md](../../architecture/data-state.md)
- [architecture/routing.md](../../architecture/routing.md)
- [architecture/i18n.md](../../architecture/i18n.md)
- [api/copilotkit.md](../../api/copilotkit.md)
- [api/jobs-events.md](../../api/jobs-events.md)
- [design-system/interactions.md](../../design-system/interactions.md)
- `orchestration/execution/handoffs/runtime.md` and the other completed handoffs from its stage. These are required when this stage starts.

## Retrieve First

D05 for the pinned SDK's state/tool events, useAgent and human-response lifecycle. Reuse foundation's demonstrated adapter rather than switching API generations. The source index is [docs-retrieval.md](../docs-retrieval.md).

## Own These Paths

Stage 3. All paths below are repository-relative.

- `packages/server/src/modules/live/`
- `apps/web/src/copilot/`
- `apps/web/src/features/workspace/`
- `apps/web/src/features/evidence/`
- `orchestration/execution/handoffs/live-workspace.md`
- Shared set S is read-only. Request needed edits from this stage's named S owner.

## Starting Reality Check

Stage 2 session, storage, queue and UI helpers are merged. The SDK probe has proven the protocol. Site state arrives through same-stage frozen event contracts. Procurement/dispatch are later, so do not fabricate their complete journey. Confirm the supplied stage base and worktree before editing. Re-read optional root feedback before handoff.

## Deliver

1. Implement authorized consistent snapshot/evidence reads and cursor-based AG-UI replay, with a single web state adapter and reconnect recovery.
2. Build the project workspace, StateChangeCard, IssueCard and evidence detail views with source author, message, originals and operation/compensation history.
3. Expose issue/task status and due-date actions through the existing typed site command route, and slots for reporting's query widget and later procurement cards.
4. Replace the probe with durable production checkpoint transport and actual SDK tool registration. Persist pending interaction identity so reload can resume the same backend decision.
5. Show distinct local/remote states, provider attribution and typed failures. Filter restricted fields on the server, preserve focus/form state and report connection staleness.

## Constraints

Do not implement SupplierComparisonCard, ProcurementApprovalCard, approval persistence or a send client. Those owners supply feature exports. Do not edit global routes/registries; ask site-domain to wire exports. No optimistic stock changes or second server-state store. Use a separate worktree, preserve user changes, and give the Orchestrator a complete commit for sequential integration. Delegate or request any out-of-scope edit; do not copy a helper to avoid ownership rules.

## Required Tests

Unit/integration: no UI snapshot suite. Typecheck against the exact SDK. E2E: manually verify two browsers, evidence access and pending-checkpoint reload during the integrated Stage 3 check. Full RF25 approval-to-send acceptance occurs once after Stages 5/6. Follow [minimum testing](../../testing/strategy.md); record checks without claiming unrun acceptance.

## Definition Of Done

RF08, RF21 and RF22 are visible and RF25's durable SDK transport is ready for the later decision/send modules. Stage 3 project state is truthful, replayable and role-filtered; no fixture success is presented as a live result. Write the owned handoff with commit, checks, relevant feedback and unresolved items. Do not start a later stage yourself.

