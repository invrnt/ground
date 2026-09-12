# Minimum hackathon testing

The user's instruction overrides the PRD's exhaustive testing schedule. Implement all required behavior. Spend test effort on wrong balances, unauthorized actions, duplicate effects and irreversible uncertainty. Do not turn every acceptance row into its own suite.

## TDD method

For the seven small critical files below, write the failing invariant case, implement the smallest behavior that passes, and stop after the relevant checks pass. For styling, simple presentation, DTO plumbing and reversible edits, implement first and inspect manually. Do not write tests that merely reproduce the implementation.

| File to implement | Owner | Minimum assertion group |
| --- | --- | --- |
| `packages/server/src/modules/ingestion/ingestion.critical.test.ts` | telegram-intake | Three identical updates produce one input/effect key; late reply photo keeps author and report association |
| `packages/server/src/modules/site/site.critical.test.ts` | site-domain | 81%, zero stock, 20 boxes, repeated milestone; overspend/concurrent command stays valid; correction yields stock 1 and need 19 |
| `packages/server/src/modules/purchases/purchases.critical.test.ts` | purchases | Invoice 228,000 leaves stock 4; repeated receipt ends at 10 with one receipt/movement |
| `packages/server/src/modules/sourcing/sourcing.critical.test.ts` | sourcing | A/B/C totals/ranking plus price-per-m², alternate coverage and unknown charges |
| `packages/server/src/modules/procurement/procurement.critical.test.ts` | procurement | Worker/foreign session rejected; stale, expired and changed-recipient decisions cannot send; repeated valid approval gives one outbox row |
| `packages/server/src/modules/workspace-sync/workspace-sync.critical.test.ts` | office-sync | Timeout after remote create reconciles one object or stays in review; no blind second create |
| `packages/server/src/modules/dispatch/dispatch.critical.test.ts` | dispatch | Uncertain send never auto-repeats; restart retains conditional follow-up; resolved or retired subject cancels it |

Reuse one small database fixture supplied by runtime. Run transaction/uniqueness checks against an isolated test PostgreSQL database or schema, never the demo's active data. Distinct worktrees use distinct test namespaces. Use typed provider fakes for controlled timeout cases. No paid API calls in default tests. Test jobs with an injected clock rather than sleeping two minutes.

## Layers and coverage

- Unit checks cover calculations and compatibility inside the relevant critical file.
- Database/API integration checks cover dedupe, stock, receipts, approval and job state.
- One manual real-service end-to-end journey covers UI, Telegram, OpenAI, CopilotKit, Exa and Ambiguous together.
- One short supplemental session covers the remaining user flows and recovery views. Reuse evidence already obtained by a critical check.

Coverage target: all seven named invariant groups, not a line or branch percentage. There is no coverage tool installation requirement, UI snapshot suite, browser automation requirement, load test or cross-browser matrix. No new automated files unless an observed serious defect needs a focused regression.

## Merge gates

Before an agent hands off, run typecheck and its changed critical file if it owns one. UI-only agents inspect the affected view. The Orchestrator merges only complete contributions. The stage's shared owner wires registrations and runs `pnpm check` once on the combined stage; this command runs typecheck, build and the implemented critical files. Stage 1 can have zero tests and must say so explicitly.

Later stages start only after the previous stage's named exit criteria and combined gate are green. Do not use tests against a peer's unmerged branch. Available provider capability probes run once early and their results are reused; missing access must be recorded and resolved before the stage requiring the actual capability can exit.

Before delivery, run the [live journey and supplemental checks](critical-journeys.md) once. Correct arithmetic, session authorization, no duplicate external effects, real sponsor results and no secret exposure are release blockers. Visual polish that does not impede the demo is not.

## Explicitly deferred effort

Thirty separately automated acceptance cases, twenty extra model inputs, statistical accuracy scoring, twenty timings per input class, claimed p95, five-user load campaigns, three mandatory consecutive rehearsals and exhaustive accessibility audits are deferred. Preserve the PRD's targets in the acceptance inventory. Mark observed, automated, inspected, untested or blocked; never invent a passing result.

Stop retesting when the relevant checks are green. Repeat the full live journey only if a subsequent change invalidates its recorded result.
