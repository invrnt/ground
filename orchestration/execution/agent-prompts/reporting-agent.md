# Reporting agent

## Mission

Provide grounded project answers and one versioned report model for HTML, PDF and Ambiguous.

## First Read

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../README.md)
- [system-overview.md](../../architecture/system-overview.md)
- [contracts.md](../../api/contracts.md)
- [ownership.md](../ownership.md)
- [strategy.md](../../testing/strategy.md)
- Root `FEEDBACK.md`, if present; check the primary checkout through the Orchestrator for uncommitted updates.
- [product/reports.md](../../product/reports.md)
- [product/scenario.md](../../product/scenario.md)
- [api/endpoints.md](../../api/endpoints.md)
- [api/jobs-events.md](../../api/jobs-events.md)
- [architecture/i18n.md](../../architecture/i18n.md)
- [architecture/data-state.md](../../architecture/data-state.md)
- `orchestration/execution/handoffs/site-domain.md` and the other completed handoffs from its stage. These are required when this stage starts.

## Retrieve First

D08 for the pinned PDF library's text/font/wrapping APIs only as needed. Read the current report/stock/task DTOs; do not use an external model for authoritative totals. The source index is [docs-retrieval.md](../docs-retrieval.md).

## Own These Paths

Stage 4. All paths below are repository-relative.

- `packages/server/src/modules/reporting/`
- `apps/web/src/features/reports/`
- `orchestration/execution/handoffs/reporting.md`
- Shared set S is read-only. Request needed edits from this stage's named S owner.

## Starting Reality Check

Site state, evidence, permissions and live slots are merged. Sourcing and purchase are same-stage peers on fixed contracts. Office-sync comes later and must consume your report DTO. Confirm the supplied stage base and worktree before editing. Re-read optional root feedback before handoff.

## Deliver

1. Implement bounded, source-grounded inventory/progress/issues/task queries, including tomorrow's 20 boxes and Juan review.
2. Generate an immutable ReportSnapshot with all required sections and version/source metadata from authorized persisted data.
3. Render the same snapshot to HTML and server PDF with consistent dates, amounts, evidence and status.
4. Provide a report view and separately exported query widget for workspace registration. Expose remote report link/version as metadata supplied by office-sync.
5. Subscribe to agreed future proposal/request events so later dispatch changes create a report content version. Avoid report-update loops on sync metadata only.

## Constraints

No second domain calculation, database chat system, PDF-specific business model or direct Ambiguous client. Do not edit workspace feature code; export the query widget and ask sourcing to register it. Use a separate worktree, preserve user changes, and give the Orchestrator a complete commit for sequential integration. Delegate or request any out-of-scope edit; do not copy a helper to avoid ownership rules.

## Required Tests

Unit/integration: no separate report suite for duplicated DTO formatting. Manually compare one HTML/PDF pair with the same snapshot and inspect wrapping. E2E: query and final same-document version are covered in the one release journey. Follow [minimum testing](../../testing/strategy.md); record checks without claiming unrun acceptance.

## Definition Of Done

RF15 and RF16's source model/renderers are complete and mergeable. HTML and PDF agree, queries cite persisted facts, and the typed report is ready for Stage 5 office synchronization. Write the owned handoff with commit, checks, relevant feedback and unresolved items. Do not start a later stage yourself.

