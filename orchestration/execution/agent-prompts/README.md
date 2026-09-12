# Agent index

Start with [root AGENTS.md](../../../AGENTS.md) and [The Orchestrator](orchestrator-agent.md). There are fifteen implementation assignments. The Orchestrator coordinates them, owns no application code and performs the final GitHub feedback review.

| Stage | Prompt | Scope | Shared owner |
| --- | --- | --- | --- |
| 1 | [foundation-agent.md](foundation-agent.md) | Scaffold, contracts, pinned SDK adapter and access probes | Yes |
| 2 | [runtime-agent.md](runtime-agent.md) | Persistence, auth, queue, private files and setup | Yes |
| 2 | [telegram-intake-agent.md](telegram-intake-agent.md) | Real messages, reply media, authors and dedupe | No |
| 2 | [interface-foundation-agent.md](interface-foundation-agent.md) | Shared UI, login, formatting and API client | No |
| 3 | [site-domain-agent.md](site-domain-agent.md) | Work, stock, tasks, needs and corrections | Yes |
| 3 | [interpretation-agent.md](interpretation-agent.md) | OpenAI, proposals and clarification | No |
| 3 | [live-workspace-agent.md](live-workspace-agent.md) | Evidence, X-Ray, AG-UI and CopilotKit state/checkpoints | No |
| 4 | [sourcing-agent.md](sourcing-agent.md) | Exa and supplier comparison | Yes |
| 4 | [purchases-agent.md](purchases-agent.md) | Invoice and explicit receipt | No |
| 4 | [reporting-agent.md](reporting-agent.md) | Grounded questions, HTML/PDF/report DTO | No |
| 5 | [procurement-agent.md](procurement-agent.md) | Versioned request and exact approval | Yes |
| 5 | [office-sync-agent.md](office-sync-agent.md) | Verified Ambiguous file, task and document | No |
| 6 | [operations-agent.md](operations-agent.md) | Retry, reset, health and run evidence export | Yes |
| 6 | [dispatch-agent.md](dispatch-agent.md) | Approved send, reply and durable follow-up | No |
| 7 | [release-readiness-agent.md](release-readiness-agent.md) | Final fixes, one rehearsal and delivery package | Yes |

Agents in one stage can run in parallel only in separate worktrees using [their exclusive paths](../ownership.md). The shared owner completes registration after peer contributions are ready. The Orchestrator merges sequentially and starts the next stage only after the combined gate passes.

Each prompt uses the same ten sections. Give an implementation agent the actual worktree path, branch, base commit and relevant latest feedback when dispatching. Read the prior merged stage's handoffs, not another agent's assumptions about future work.

After Stage 7 merges, the Orchestrator reviews root `FEEDBACK.md` and repository PR feedback. Any accepted fix becomes a bounded repair assignment with explicit temporary ownership, affected checks and a final re-review.
