# Release readiness agent

## Mission

Deliver a reproducible hackathon build and evidence package with only the required final fixes.

## First Read

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../README.md)
- [system-overview.md](../../architecture/system-overview.md)
- [contracts.md](../../api/contracts.md)
- [ownership.md](../ownership.md)
- [strategy.md](../../testing/strategy.md)
- Root `FEEDBACK.md`, if present; check the primary checkout through the Orchestrator for uncommitted updates.
- [product/requirements-map.md](../../product/requirements-map.md)
- [product/demo-delivery.md](../../product/demo-delivery.md)
- [product/scenario.md](../../product/scenario.md)
- [testing/critical-journeys.md](../../testing/critical-journeys.md)
- [testing/acceptance-matrix.md](../../testing/acceptance-matrix.md)
- [execution/parallel-workstreams.md](../../execution/parallel-workstreams.md)
- [architecture/security-performance.md](../../architecture/security-performance.md)
- `orchestration/execution/handoffs/operations.md` and the other completed handoffs from its stage. These are required when this stage starts.

## Retrieve First

Review all prior provider/SDK findings and retrieve only docs needed for an observed defect. Verify the actual event portal rules when its URL/access is available. Use D09 only for help interpreting PR feedback supplied by the Orchestrator. The source index is [docs-retrieval.md](../docs-retrieval.md).

## Own These Paths

Stage 7. All paths below are repository-relative.

- `All implemented application paths transferred in execution/ownership.md`
- `tests/release/`
- `docs/release/`
- `orchestration/execution/handoffs/release-readiness.md`
- Shared set S for Stage 7, exactly as listed in [ownership](../ownership.md). No peer may edit S during this stage.

## Starting Reality Check

All six implementation stages have merged and passed their gates. Earlier owners are inactive and application repair ownership transfers to you. Root FEEDBACK.md may have changed. The Orchestrator will perform the final repository PR review after your work merges. Confirm the supplied stage base and worktree before editing. Re-read optional root feedback before handoff.

## Deliver

1. Run the minimum release gate and one main live journey with all four sponsors. Complete the short supporting invoice/receipt/correction/recovery checks, reusing existing evidence where valid.
2. Fix only observed release blockers and regressions under the final ownership grant. Keep all feature functionality, authorization, evidence and real-provider behavior intact.
3. Prepare install/run/reset instructions, environment names, exact versions/models, media manifest, redacted run export, checked commit and honest test outcomes.
4. Produce or assemble the 120-second video, English subtitles/narration, full recording and supporting technical evidence with legible 1080p framing and approved evaluator access. Record any missing human media/access needed to finish.
5. Package the PRD product description and verify available event rules. After the Orchestrator reviews GitHub feedback, record PR links and handled/deferred status in docs/release/feedback-review.md; apply delegated fixes in a fresh worktree when needed.

## Constraints

No new functionality, broad refactor, benchmark campaign or requirement for three rehearsals. Never fabricate live data, test results, prices or recordings. Do not modify PRD.md, FEEDBACK.md, secrets or other agents' handoffs. Pause exact paths if the Orchestrator assigns a specialist repair. Use a separate worktree, preserve user changes, and give the Orchestrator a complete commit for sequential integration. Delegate or request any out-of-scope edit; do not copy a helper to avoid ownership rules.

## Required Tests

Unit/integration: run the implemented seven critical files plus typecheck/build once; add a regression only for an observed serious defect. E2E: one main live journey and the short support session. Repeat only checks invalidated by a later fix. Mark deferred metrics and any incomplete original acceptance honestly. Follow [minimum testing](../../testing/strategy.md); record checks without claiming unrun acceptance.

## Definition Of Done

The required build and evidence package is usable, required behavior has no known blocker, and all changes are mergeable with an accurate release handoff. Final declaration additionally requires the Orchestrator's GitHub feedback review or an explicit access-blocker report. Write the owned handoff with commit, checks, relevant feedback and unresolved items. Do not start a later stage yourself.

