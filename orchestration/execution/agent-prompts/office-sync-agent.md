# Office sync agent

## Mission

Maintain verified Ambiguous photo, assigned task and report resources without duplicate creations.

## First Read

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../README.md)
- [system-overview.md](../../architecture/system-overview.md)
- [contracts.md](../../api/contracts.md)
- [ownership.md](../ownership.md)
- [strategy.md](../../testing/strategy.md)
- Root `FEEDBACK.md`, if present; check the primary checkout through the Orchestrator for uncommitted updates.
- [product/office-sync.md](../../product/office-sync.md)
- [product/reports.md](../../product/reports.md)
- [api/ambiguous.md](../../api/ambiguous.md)
- [api/jobs-events.md](../../api/jobs-events.md)
- [architecture/integrations.md](../../architecture/integrations.md)
- [execution/docs-retrieval.md](../../execution/docs-retrieval.md)
- `orchestration/execution/handoffs/sourcing.md` and the other completed handoffs from its stage. These are required when this stage starts.

## Retrieve First

D07 is mandatory. Obtain actual account API methods/bodies and verify Juan assignment, due dates, upload/read, document update and reconciliation support. Read foundation's redacted findings; do not infer endpoints from local port names. The source index is [docs-retrieval.md](../docs-retrieval.md).

## Own These Paths

Stage 5. All paths below are repository-relative.

- `packages/server/src/adapters/ambiguous/`
- `packages/server/src/modules/workspace-sync/`
- `orchestration/execution/handoffs/office-sync.md`
- Shared set S is read-only. Request needed edits from this stage's named S owner.

## Starting Reality Check

Stage 4 report DTOs and Stage 3 tasks/evidence are merged. Foundation must have obtained the account contract or recorded the access blocker. Do not begin speculative adapter coding against unavailable schema. Confirm the supplied stage base and worktree before editing. Re-read optional root feedback before handoff.

## Deliver

1. Implement the sole Ambiguous adapter against verified account APIs and persist ExternalObjectLink metadata.
2. Upload the original photo once, create/update Juan's task with due date and evidence URL, and read each resource back.
3. Create one run/project/date document from ReportSnapshot and update its managed section as content changes. Preserve human content and coalesce to the latest desired version.
4. Handle known retries, uncertain creates, marker/ID reconciliation, unavailable user configuration and manual-review fallback without blind duplicate writes.
5. Export handlers for attachment/task/report jobs, including late photos and future request completion events. Provide verified remote links/status for existing views through the shared DTOs.

## Constraints

No direct changes to Ground's authoritative work state, reporting logic or UI-owned files. No Google connector substitute, guessed endpoints, full-document overwrite of human content or cleanup outside Ground's demo run. Use a separate worktree, preserve user changes, and give the Orchestrator a complete commit for sequential integration. Delegate or request any out-of-scope edit; do not copy a helper to avoid ownership rules.

## Required Tests

Unit/integration: workspace-sync.critical.test.ts simulates a remote-create timeout and proves unique reconciliation or explicit review. E2E: one actual Drive/Tasks/Docs create-update-read chain, reusing capability probe resources only when properly scoped and marked. Follow [minimum testing](../../testing/strategy.md); record checks without claiming unrun acceptance.

## Definition Of Done

RF27 is verified with remote IDs/URLs, Juan/due date and same-document update. The adapter handles uncertainty without duplicate resources. Any missing required account capability blocks Stage 5 completion explicitly. Write the owned handoff with commit, checks, relevant feedback and unresolved items. Do not start a later stage yourself.

