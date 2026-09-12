# Interpretation agent

## Mission

Turn supported Telegram reports into validated proposals or bounded, durable clarification.

## First Read

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../README.md)
- [system-overview.md](../../architecture/system-overview.md)
- [contracts.md](../../api/contracts.md)
- [ownership.md](../ownership.md)
- [strategy.md](../../testing/strategy.md)
- Root `FEEDBACK.md`, if present; check the primary checkout through the Orchestrator for uncommitted updates.
- [product/interpretation.md](../../product/interpretation.md)
- [product/scenario.md](../../product/scenario.md)
- [api/openai.md](../../api/openai.md)
- [api/telegram.md](../../api/telegram.md)
- [api/jobs-events.md](../../api/jobs-events.md)
- [api/errors.md](../../api/errors.md)
- `orchestration/execution/handoffs/runtime.md` and the other completed handoffs from its stage. These are required when this stage starts.

## Retrieve First

D04: current file transcription, image/PDF input and structured-output behavior for the selected account models. Read foundation's pinned SDK evidence first and retain separate model settings. The source index is [docs-retrieval.md](../docs-retrieval.md).

## Own These Paths

Stage 3. All paths below are repository-relative.

- `packages/server/src/adapters/openai/`
- `packages/server/src/modules/interpretation/`
- `orchestration/execution/handoffs/interpretation.md`
- Shared set S is read-only. Request needed edits from this stage's named S owner.

## Starting Reality Check

Authorized input, originals, worker ports and project context exist from Stage 2. Site handlers are a same-stage peer. Purchase, reporting and procurement handlers arrive later; export intents against frozen contracts without claiming their effects completed. Confirm the supplied stage base and worktree before editing. Re-read optional root feedback before handoff.

## Deliver

1. Implement one OpenAI adapter for transcription and structured interpretation, with separate configured models and metadata.
2. Enforce audio/file/PDF limits and supported format conversion while retaining originals. Handle refusal, incomplete output, model failure and unreadable invoice state.
3. Resolve location/material aliases, assignee and scenario-relative dates from project context. Produce site, purchase, receipt, correction and query intents; ignore irrelevant chat.
4. Persist clarification state, permitted respondents, expected version, expiry and at most two questions or a selection. Resume once from a role-checked callback and preserve unresolvable input.
5. Dispatch only validated allowed commands via registered services and return truthful Spanish clarification content to the intake reply port. Keep untrusted source instructions out of permissions and tools.

## Constraints

No direct domain SQL, balances, provider writes beyond OpenAI, trusted actor IDs from the model or duplicate query service. Do not modify Telegram adapter, shared schemas or model credentials. Use a separate worktree, preserve user changes, and give the Orchestrator a complete commit for sequential integration. Delegate or request any out-of-scope edit; do not copy a helper to avoid ownership rules.

## Required Tests

Unit/integration: no separate model benchmark or broad test suite. Inspect one canonical audio/photo extraction and invoice extraction plus malformed/refused/ambiguous input through the existing schema boundary. E2E: reuse Stage 3's report path and the release supporting clarification/unreadable checks. Follow [minimum testing](../../testing/strategy.md); record checks without claiming unrun acceptance.

## Definition Of Done

RF03, RF05 and RF06 are implemented with retained evidence and recoverable states. Model identifiers/schema versions are recorded. Valid operations reach the registered service; uncertain input cannot silently mutate state. Write the owned handoff with commit, checks, relevant feedback and unresolved items. Do not start a later stage yourself.

