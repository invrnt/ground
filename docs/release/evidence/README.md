# Evidence index

`local-baseline-export.json` is an actual OperationsService export from a freshly seeded isolated PostgreSQL schema at code `52833a7`. The schema was removed afterward. It has no input, operation, source, approval, request or provider-call records. It is a reproducible-format example and does not demonstrate the live journey. Do not present it as the final run export.

| Evidence | Kind | Location |
| --- | --- | --- |
| Release typecheck/build and 13 critical cases | Local gate, real isolated PostgreSQL | [Validation](../validation.md), [gate summary](release-gate.txt) |
| CopilotKit server state, tool callback and reload | Actual isolated SDK/browser protocol probe | [Foundation handoff](../../../orchestration/execution/handoffs/foundation.md) |
| Exa search/content | One actual provider read; no price or product-match claim | [Sourcing handoff](../../../orchestration/execution/handoffs/sourcing.md) |
| OpenAI audio/photo/PDF parsing path | Controlled SDK response, actual ffmpeg/database | [Interpretation handoff](../../../orchestration/execution/handoffs/interpretation.md) |
| HTML/PDF shared snapshot | Local two-page rendered comparison | [Reporting handoff](../../../orchestration/execution/handoffs/reporting.md) |
| Ambiguous API mappings | Public OpenAPI, account access pending | [Office handoff](../../../orchestration/execution/handoffs/office-sync.md) |
| Approval/dispatch uncertainty and restart | Controlled transport, actual PostgreSQL | [Procurement](../../../orchestration/execution/handoffs/procurement.md), [dispatch](../../../orchestration/execution/handoffs/dispatch.md) |
| Reset and redaction | Local OperationsService observation | [Operations handoff](../../../orchestration/execution/handoffs/operations.md) |
| Main run video, live export and provider object links | Pending | Record after configuration; no placeholders count as evidence |

For the final run, retain source message/update IDs, exact code/scenario/model versions, project/run IDs, approval and request IDs, actual provider message ID, Ambiguous object IDs/verified versions, source URLs and capture timestamps. Store secrets separately. Intended evaluator links must preserve private access; no public bearer URLs belong in this repository.

The OpenAI row above is historical evidence. Current transport is OpenRouter; see the [migration handoff](../../../orchestration/execution/handoffs/openrouter.md). No live OpenRouter result has been recorded.
