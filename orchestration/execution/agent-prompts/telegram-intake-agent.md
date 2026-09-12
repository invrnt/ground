# Telegram intake agent

## Mission

Persist authorized Telegram inputs exactly once and associate reply media with the correct report and author.

## First Read

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../README.md)
- [system-overview.md](../../architecture/system-overview.md)
- [contracts.md](../../api/contracts.md)
- [ownership.md](../ownership.md)
- [strategy.md](../../testing/strategy.md)
- Root `FEEDBACK.md`, if present; check the primary checkout through the Orchestrator for uncommitted updates.
- [product/telegram-intake.md](../../product/telegram-intake.md)
- [api/telegram.md](../../api/telegram.md)
- [api/jobs-events.md](../../api/jobs-events.md)
- [api/errors.md](../../api/errors.md)
- [architecture/security-performance.md](../../architecture/security-performance.md)
- `orchestration/execution/handoffs/foundation.md` and the other completed handoffs from its stage. These are required when this stage starts.

## Retrieve First

D03: webhook authentication, update/message IDs, reply fields, callback queries, media downloads and confirmed/uncertain send results in the official Telegram Bot API. The source index is [docs-retrieval.md](../docs-retrieval.md).

## Own These Paths

Stage 2. All paths below are repository-relative.

- `packages/server/src/adapters/telegram/`
- `packages/server/src/modules/ingestion/`
- `orchestration/execution/handoffs/telegram-intake.md`
- Shared set S is read-only. Request needed edits from this stage's named S owner.

## Starting Reality Check

Foundation contracts are merged. Runtime infrastructure is a same-stage peer: use the declared ports and typed doubles during development, then verify against the merged runtime at the stage gate. Confirm the supplied stage base and worktree before editing. Re-read optional root feedback before handoff.

## Deliver

1. Implement the sole Telegram adapter and authenticated webhook normalization. Persist update/message identity and project/run binding before acknowledgement.
2. Persist original source metadata and allowed media, keeping hash, sender and reply identity. Explicit replies join a report; ambiguous attachments wait for clarification.
3. Deduplicate repeat updates and late photos without repeating operation keys. Support simultaneous authors and protected evidence references.
4. Implement Spanish durable-receipt and post-commit summaries using actual state, plus callback delivery and reply routing ports for interpretation/dispatch.
5. Export route/job registrations for the shared owner. Route all replies through durable outbox and keep cost, address and approval details out of worker-group copy.

## Constraints

Do not edit queue/database internals, migrations, registries or manifests. Do not implement extraction, clarification decisions, inventory or procurement dispatch. Do not send to a real merchant found online. Use a separate worktree, preserve user changes, and give the Orchestrator a complete commit for sequential integration. Delegate or request any out-of-scope edit; do not copy a helper to avoid ownership rules.

## Required Tests

Unit/integration: implement only ingestion.critical.test.ts for repeated updates and late-photo/author association, using the shared isolated database fixture when runtime merges. E2E: one real authorized input/acknowledgement at Stage 2; final multimodal/send journey belongs to release. Follow [minimum testing](../../testing/strategy.md); record checks without claiming unrun acceptance.

## Definition Of Done

RF02 and RF04 are implemented with one client and one logical input per provider update. The module is mergeable against frozen contracts; its critical check and the integrated real intake check pass. Write the owned handoff with commit, checks, relevant feedback and unresolved items. Do not start a later stage yourself.

