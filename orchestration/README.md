# Ground implementation contract

Build the MVP in [PRD.md](../PRD.md): a Telegram voice note and photo update a construction project, trigger supplier research, maintain Ambiguous, and prepare a request that a supervisor approves through CopilotKit.

This folder contains instructions for future implementation agents. It does not contain application code. All implementation paths below are relative to the repository root and are planned unless the reality check says otherwise.

## Read in this order

1. [Root agent rules](../AGENTS.md), then root `FEEDBACK.md` if present.
2. [Decisions and assumptions](architecture/decisions.md), [system overview](architecture/system-overview.md), and [repository structure](architecture/repo-structure.md).
3. [Scenario](product/scenario.md) and [requirement ownership](product/requirements-map.md).
4. [Shared contracts](api/contracts.md), [events and jobs](api/jobs-events.md), and [boundaries](architecture/boundaries.md).
5. [Build order](execution/build-order.md), [parallel workstreams](execution/parallel-workstreams.md), and [path ownership](execution/ownership.md).
6. Your [agent prompt](execution/agent-prompts/README.md), its feature contracts, and the prior stage's handoffs.
7. [Minimum testing](testing/strategy.md) before writing tests or claiming completion.

## Directory map

| Directory | Contract |
| --- | --- |
| `architecture/` | Stack, layers, persistence, entrypoints, UI, language, integrations, security and performance |
| `design-system/` | Tokens, reusable UI components, interaction states |
| `product/` | Scenario and one implementation spec per module or user experience |
| `api/` | Ground HTTP endpoints, typed service boundaries, provider adapters, errors and durable events |
| `testing/` | Small regression set, one live journey, original acceptance inventory |
| `execution/` | Dependency stages, exclusive ownership, source retrieval and handoffs |
| `execution/agent-prompts/` | The Orchestrator role and fifteen bounded implementation assignments |

## Modules

Project setup and identity; Telegram intake; multimodal interpretation and clarification; work progress, inventory, issues, tasks and corrections; invoice and receipt capture; live workspace and evidence; Exa research and comparison; procurement approval; dispatch and follow-up; Ambiguous synchronization; queries and reports; operations, reset and run export; demo delivery.

## Core principles

- Ground's committed database state is authoritative. Models propose changes; server code validates and applies them.
- A quote request requires approval of its exact version, text and recipient. Research and internal workspace synchronization follow the configured project policy.
- Commit state, events and outbox together. Recover from persistence after a browser or worker restart.
- Keep one implementation of each calculation, client, schema, UI component and state mechanism.
- Parallel work uses separate worktrees and exclusive paths. Merge and check a complete stage before starting the next.
- The Orchestrator delegates code work, checks optional root feedback during execution, and reviews repository PR feedback after all agents finish.
- Build all P0 behavior, but follow the user's reduced testing instruction. No coverage quota, benchmark campaign or mandatory three-run rehearsal.

## Non-goals

WhatsApp, multiple organizations or projects, native apps, video ingestion, long documents, payments, placing commercial orders, accounting, payroll, BIM, photo-derived measurements, technical certification, full scheduling, Exa price monitoring, and Ambiguous Sheets, CRM, Calendar, Mail or bidirectional sync. No new agent framework, Redis, vector database or separate microservices for this hackathon.

The exact requirement assignments are in [requirements-map.md](product/requirements-map.md). Fixtures never count as live integration evidence.
