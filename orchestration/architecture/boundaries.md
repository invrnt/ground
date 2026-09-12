# Boundaries and layers

| Layer | Responsibility | Forbidden dependency |
| --- | --- | --- |
| Contracts | Zod schemas, DTOs, operation and event names, service ports | React, database, provider SDKs |
| Domain | Exact quantity and money calculations, work rules, invariants | Network, database, clocks, UI |
| Server modules | Authorization, transactions, use cases, durable transitions | Browser state or another module's internal SQL |
| Infrastructure | Database, private files, sessions, queue leasing, clock and IDs | Construction decisions or provider-specific prompts |
| Provider adapters | Typed provider requests, normalized responses and error mapping | Direct domain mutations or arbitrary model-selected destinations |
| Composition roots | Inject services and register routes/jobs/features | Business logic |
| Web features | Present DTOs, collect input, invoke server actions | Provider keys, direct SQL, recalculation of business totals |

Server modules may import domain functions and contract ports. Cross-module operations use injected ports. Modules own SQL for their entity families and may join authorized read models; only the shared owner edits migrations. The runtime supplies a transaction context so several operations can use the same connection without nested transactions.

Use one `InventoryService` for movements, one `QuantityCalculator` in domain, one `ReportService` for report snapshots, one `ApprovalService` for authorization, and one Telegram adapter for all sends. Do not fork these inside sourcing, purchases, report export or reminder code.

The report-to-action workflow is explicit TypeScript orchestration. No general autonomous multi-agent runtime is needed. Tool names map to bounded server functions in [contracts](../api/contracts.md). Model output never supplies trusted `actor_id`, `project_id`, tools or credentials.

Module dependencies and stage order are in [build-order.md](../execution/build-order.md). Same-stage modules communicate through contracts frozen before their stage; the shared owner wires them after they are mergeable.
