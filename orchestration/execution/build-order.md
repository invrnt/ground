# Build order

The Orchestrator dispatches the prompts in [the agent index](agent-prompts/README.md). Parallel peers use separate worktrees from the same merged stage base and consume frozen contracts. Each stage includes a short sequential integration step by its shared owner; no later stage starts until that step is merged and green.

| Stage | Agents | Dependency outcome and exit criteria |
| --- | --- | --- |
| 1. Foundation | foundation | Workspace builds; commands/contracts/registration slots exist; versions pinned; CopilotKit event plus response round trip works; all four provider access/capability statuses recorded and available probes run; no invented Ambiguous schema |
| 2. Runtime and entrypoints | runtime, telegram-intake, interface-foundation | Database migrations/seed, sessions, private storage and durable queue usable; real Telegram input persisted once; web sign-in/shell built; own gate green |
| 3. Report to project state | site-domain, interpretation, live-workspace | Audio/reply photo produces 81%, zero stock, leak and Juan assignment; evidence/X-Ray updates after commit; clarification and correction paths exist; stored checkpoint/reconnect works |
| 4. Material and report modules | sourcing, purchases, reporting | Automatic need research/comparison, purchase versus receipt, grounded query and common HTML/PDF/report DTO are wired; all fixture arithmetic correct; real Exa source confirmed if not already confirmed |
| 5. Office and decision | procurement, office-sync | Exact versioned proposal and persisted approval outbox; real Ambiguous file/task/document verified, including Juan/date; approval survives reload; stage gate green |
| 6. Delivery and controls | operations, dispatch | Approved request reaches demo chat; response/follow-up/reconciliation work; report updates through prior office-sync module; admin retry/reset/run export complete; old runs fenced |
| 7. Release | release-readiness | Minimum checks and one live rehearsal recorded; supplemental flows checked; installation/reset/evidence package and demo ready; final changes merged; Orchestrator reviews GitHub PR feedback before completion |

Stage 1 capability status is not a claim of live acceptance. Missing credentials are named immediately. Ambiguous's exact account schema must be obtained before office-sync implementation and its real writes must pass Stage 5. Telegram/OpenAI access must work for their Stage 2/3 exits. Do not pass a required real-provider gate using fixtures. Escalate a concrete missing capability while completing independent in-stage work.

## Fastest safe path

Freeze shared DTOs and prove the SDK transport first. In Stage 2 run infrastructure, intake and shell concurrently. In Stage 3 split deterministic domain work, interpretation and live presentation against those contracts. Stage 4 runs research, invoice handling and reporting independently. Stage 5's procurement and office synchronization use the already merged need/report contracts. Dispatch waits for real approval persistence in Stage 6.

Workers may execute Exa and independent Ambiguous jobs concurrently at runtime; that does not change source-code ownership. Agent parallelism is limited to nonoverlapping paths and available worktree slots. With fewer agents, use the same stages sequentially, with the shared owner integrating last.

## Freeze and handoff

At Stage 7, freeze functionality. Fix only defects that prevent required behavior, safe approval, real provider evidence or a usable recording. The user removed benchmark campaigns and repeated rehearsal requirements. Do not cut invoice/receipt, correction, reset, Exa, Ambiguous or CopilotKit to save time.

Each stage handoff names its merged commit, exact checks, known missing acceptance and the latest reviewed root feedback. Follow [parallel-workstreams.md](parallel-workstreams.md) for late human/PR feedback and repair worktrees.
