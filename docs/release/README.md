# Ground release package

The implementation is ready for a configured demo. Live acceptance and the recording remain pending the user's provider accounts, authorized media, recipient and event portal.

Judges can start with the [evaluation guide](../../JUDGES.md). Developers can start with [the runbook](runbook.md). [Validation](validation.md) separates executed local checks from pending live acceptance. [Evidence](evidence/README.md) links prior observations and the explicitly local baseline export. [Recording instructions](recording/README.md) include the exact PRD narration, editable subtitle timing and a shot list. [Submission copy](submission.md) contains the product description and unresolved event requirements.

The historical release gate checked application commit `52833a7033eb801163fb5159bb9bee0cba5e7a89`. All 13 tests across the seven critical files passed with real isolated PostgreSQL schemas, and typecheck/build passed. Later local Docker build, migration, provisioning, seed and health checks succeeded. This operational check is recorded separately in validation and does not prove a live all-provider journey or retest every later commit.

The Orchestrator completed the post-merge repository PR feedback check. No PRs or root feedback notes were present; see [the final review record](feedback-review.md).
