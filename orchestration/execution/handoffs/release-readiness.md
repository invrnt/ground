# Release readiness handoff

Stage 7 base and checked application commit `52833a7033eb801163fb5159bb9bee0cba5e7a89`. This contribution is the commit containing this handoff. Earlier implementation owners were inactive, and only the observed deployment configuration repair plus release documentation/assets were changed. PRD.md, FEEDBACK.md, secrets and prior handoffs were not edited.

## Release gate

`pnpm install --frozen-lockfile --reporter=silent` passed. Ran the required release gate once with TEST_DATABASE_URL pointing to the isolated PostgreSQL fixture service: `pnpm check` passed typecheck, all builds and 13 critical tests across seven files. Database cases ran rather than skipping. The tests covered intake3, site2, purchases1, sourcing3, procurement1, office2 and dispatch1. Existing CopilotKit bundle-size warnings remain. No repeated broad gate, new suite, benchmark or refactor was added.

Local environment was Node 26.7.0, pnpm 11.24.0 and PostgreSQL 18.4. Node 24.21.0 stays pinned for the workspace/Docker; Docker execution was unavailable due daemon access. The local fixture database is separate from the configured demo; schemas were cleaned up by the canonical fixture.

## Observed release repair

Compose's env_file could override the Dockerfile's HOST and PRIVATE_STORAGE_PATH with the example local defaults. That made the container API bind to loopback and directed uploads outside the named private volume. Added explicit container HOST=0.0.0.0, PRIVATE_STORAGE_PATH=/storage/private and WEB_DIST=/app/apps/web/dist for API/worker. Dockerfile now creates/chowns the private directory before switching to the node user, so a fresh named volume inherits writable ownership.

Validated the final Compose model using `docker compose config --no-env-resolution --format json`, without loading secrets. Assertions confirmed both services' container values and the host's localhost-only published API. Docker image startup, existing-volume ownership and HTTPS deployment remain unverified. No application source changed after the passing release gate, so no application retest was required.

## Delivered package

- `docs/release/runbook.md` has install, trusted environment loading, exact Origin handling for built UI versus Vite, private manifest setup, provisioning/seed, Compose launch, health, reset and export instructions.
- `validation.md`, `versions.json` and `evidence/release-gate.txt` record exact versions, tested commit, all original T01–T30 statuses and pending live evidence.
- `evidence/local-baseline-export.json` is a real redacted OperationsService export from a fresh isolated seed at the checked commit. It contains no inputs, operations, approvals, requests or provider calls. The fixture was removed afterward. It is explicitly labelled a format/baseline example, not the required final live export.
- `recording/narration.md` preserves the exact PRD English narration and Spanish source audio text. `narration-template.srt` supplies editable English timing; `shot-list.csv` marks every shot not_recorded. Recording instructions preserve the full causal run, readable 1080p framing and disclosure for shortened waits.
- `submission.md` includes the PRD product description, technical summary, missing portal requirements and honest artifact status. README links the package.

The tracked runtime media manifest remains an unconfigured example with no invented media or hashes. No placeholder video, fabricated provider result, guessed price or fake live export was created. No new dependency versions or environment names were added. Font licensing already lives beside the reporting font.

## Remaining live and human inputs

The user explicitly supplies credentials later and authorized implementation to proceed. Missing account access does not invalidate the local gate, but the main Telegram/OpenAI/Exa/Ambiguous/CopilotKit journey, supporting human checks, edited video, uncut capture, real run export, evaluator permissions and event eligibility remain pending. Reuse the successful Exa access probe; do not rerun provider probes solely for another local check. The configured material match and actual account-specific Ambiguous managed-block read-back still need the live run.

No event portal URL or account was supplied, so no event rules, deadlines, categories or eligibility were invented. No new full browser walkthrough was attempted during this bounded release step; prior production-browser acceptance remains unclaimed. Existing local protocol, component and PDF evidence is linked in the release evidence index.

FEEDBACK.md was absent in this worktree and the primary checkout at handoff. The Orchestrator reported no initial PRs and will recheck the actual GitHub repository after merge. Final PR-feedback disposition must still be recorded in docs/release/feedback-review.md after that check. This handoff does not claim that final review already happened.
