# Site domain handoff

Stage 2 merged base `be846e5`. Shared Stage 3 checkpoint `0cfd7bd` adds the requested additive live/evidence contracts, persistence tables and provider dependencies. Domain contribution is the commit containing this handoff. Stage 3 peer registration and combined gate remain pending.

Implemented one decimal.js calculation module for exact arithmetic, unit conversions, weighted progress and net material needs. Site commands lock the active run and project, resolve membership from PostgreSQL, validate evidence scope and expected project version, and persist operation results, state changes, events and jobs together. Idempotency keys bind actor and effect payload while allowing a refreshed expected version on replay. Insufficient stock returns needs_input without a negative movement. Repeated work completion does not add progress.

Issues, review assignments and dependencies persist independently. Only the reviewer or supervisor resolves an issue; dependent work is released only when no unresolved dependency remains. Assignment changes enqueue workspace synchronization. Stock changes recalculate needs from usable stock plus confirmed deliveries due in time; requests do not count as deliveries. Positive need versions enqueue deduplicated research.

Corrections validate original author or supervisor and append a compensating movement linked to the original operation. They leave the original movement intact. Need changes persist proposal-change intents and call an injected invalidation port in the same transaction. The future procurement owner must register its authorization invalidation/amendment handler, consuming pending intents as needed; this stage does not implement or claim approval enforcement for an unbuilt procurement module.

The Orchestrator granted `packages/server/src/modules/project/repository.ts` for canonical snapshot extension while the previous runtime owner is inactive. Recorded this in ownership.md. Snapshot now includes site issues/tasks/needs, material aliases, project name/timezone and server-computed reported progress. No second snapshot implementation was created.

## Integration exports

- `SiteService({transactions,queue,invalidation?})` implements frozen `SiteCommandService.execute` and `InventoryService.consume`. `expected_version` is the project version, not an individual entity version.
- `receive(InventoryReceiptInput, tx?)` is the sole future receipt movement path, also exposed in the additive `InventoryReceiptService` contract. Purchases supplies its validated receipt line and must commit receipt plus movement together.
- `history(context,evidenceId,tx?)` returns authorized operation results for the live evidence service. New issue IDs appear in `state_diff` with `entity_type: issue`.
- `siteModule(service,sessions)` registers authorized operation/correction routes. Canonical composition registration follows peer merge.
- `ProposalInvalidation.changed` receives context, operation/need IDs, version and reason under the active transaction. It must not make network calls. Procurement decides invalidate versus amendment based on its send claim.

## Checks and scope

The required critical file was written before implementation; first run failed on the missing service module. Its implemented scenario cases passed against one isolated PostgreSQL schema: exact 81%, milestone replay, rejected overspend, concurrent eight-box consumption yielding one applied and one conflict, zero stock/20-box need, and correction yielding one stock/19-box need while preserving original negative movement. A helper's inferred UUID type initially failed TypeScript; explicit string annotation fixed it. Final `TEST_DATABASE_URL=... pnpm exec vitest run packages/server/src/modules/site/site.critical.test.ts` passed both checks, including the PostgreSQL scenario. `pnpm --filter @ground/server typecheck` passed.

Live audio/photo and provider calls remain pending credentials under the user's timing override. No fixture is called live evidence. No broad test suite, performance measurement or extra live rehearsal was run. No FEEDBACK.md was present at start; the Orchestrator reported no PR feedback.

## Versions and configuration

Reused decimal.js 10.6.0. Verified its official `clone`, exact arithmetic, `ceil` and `toFixed` APIs; private precision is 40 significant digits. PostgreSQL transaction/locking findings from runtime remain applicable. Added OpenAI 7.15.0 at interpretation owner's verified request, existing AG-UI 0.0.59 direct server dependencies and existing CopilotKit core 1.71.1/Zod 3.25.76 web dependencies. Docker installs ffmpeg for bounded audio conversion. New optional configuration name `FFMPEG_PATH`; no values or provider credentials recorded.
