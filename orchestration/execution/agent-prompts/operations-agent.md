# Operations agent

## Mission

Make the demo observable, recoverable and exportable by run without leaking or replaying old effects.

## First Read

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../README.md)
- [system-overview.md](../../architecture/system-overview.md)
- [contracts.md](../../api/contracts.md)
- [ownership.md](../ownership.md)
- [strategy.md](../../testing/strategy.md)
- Root `FEEDBACK.md`, if present; check the primary checkout through the Orchestrator for uncommitted updates.
- [product/operations.md](../../product/operations.md)
- [product/demo-delivery.md](../../product/demo-delivery.md)
- [api/endpoints.md](../../api/endpoints.md)
- [api/jobs-events.md](../../api/jobs-events.md)
- [architecture/data-state.md](../../architecture/data-state.md)
- [architecture/security-performance.md](../../architecture/security-performance.md)
- `orchestration/execution/handoffs/procurement.md` and the other completed handoffs from its stage. These are required when this stage starts.

## Retrieve First

Read the merged job lease, provider-link and scenario-run implementations first. D02 for any uncertain reset locking behavior; D07 findings for supported safe demo cleanup. Do not add monitoring or deployment services. The source index is [docs-retrieval.md](../docs-retrieval.md).

## Own These Paths

Stage 6. All paths below are repository-relative.

- `packages/server/src/modules/operations/`
- `apps/web/src/features/operations/`
- `scripts/reset-demo.ts`
- `orchestration/execution/handoffs/operations.md`
- Shared set S for Stage 6, exactly as listed in [ownership](../ownership.md). No peer may edit S during this stage.

## Starting Reality Check

Stages 1 through 5 are merged with known provider outcomes and approved requests. Dispatch is a contract-compatible peer. Shared seed, queue and report implementations already exist and must be reused. Confirm the supplied stage base and worktree before editing. Re-read optional root feedback before handoff.

## Deliver

1. Expose admin readiness/pending work, worker/provider status, costs with a US$20 warning against the US$25 budget, retries and reconciliation links.
2. Implement authorized reset with expected run ID, active-run fencing, settled/uncertain writes, approval invalidation, old-job cancellation and a new seed through the runtime service.
3. Keep old audit/export records and safely separate or archive only Ground's demo remote objects. Reject old callback/run effects.
4. Implement redacted RunExport tying all four providers to inputs, versions, operations, sources, approvals, remote results and sends.
5. As shared owner, wire dispatch and operational routes/jobs, finish preflight/reset root commands and verify the full send-to-report chain. Record green Stage 6 commit and feedback disposition.

## Constraints

Do not create a second queue, seed function, report renderer or provider adapter. No blanket retries of uncertain writes, unscoped resets, secret dumps or claims of percentile latency from one run. Use a separate worktree, preserve user changes, and give the Orchestrator a complete commit for sequential integration. Delegate or request any out-of-scope edit; do not copy a helper to avoid ownership rules.

## Required Tests

Unit/integration: no additional broad operations suite; reuse dispatch/office critical uncertainty and run-fencing checks. Manually reset once and inspect old-job cancellation/new baseline plus redacted export. E2E: coordinate the Stage 6 send-to-report check and run the combined gate. Follow [minimum testing](../../testing/strategy.md); record checks without claiming unrun acceptance.

## Definition Of Done

RF24 and RF28 are implemented, admin operations are usable, a fresh scenario needs no manual SQL, and all required run evidence can be exported safely. Stage 6 is merged and green before release begins. Write the owned handoff with commit, checks, relevant feedback and unresolved items. Do not start a later stage yourself.

