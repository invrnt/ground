# Ambiguous document creation fix

Base commit: `f0dfe05`. The commit containing this handoff changes only the Ambiguous document visibility value and this record.

The live account identity request returned HTTP 200 and matched the configured workspace. Ground's active run contained a rejected report synchronization and an assignment waiting for its report photo. Reproducing the document request returned HTTP 400: `visibility must be one of: restricted, workspace, link, public`.

Changed document creation from `private` to `restricted`. This preserves private access using the provider's accepted value. The public OpenAPI at https://app.ambiguous.ai/api/openapi.json declares visibility as a string without enumerating these accepted values; the authenticated validation response established the constraint.

Validation on 2026-09-12:

- `pnpm --filter @ground/server typecheck` passed.
- `git diff --check` passed.
- After one identity-request transport failure, a fresh adapter probe returned identity HTTP 200, document creation HTTP 201 and document read HTTP 200. Content read-back matched. The temporary diagnostic document was deleted successfully, HTTP 200.
- No credentials, source report content or private account responses were persisted.

Deployment and recovery remain pending. Docker access is denied in this session and passwordless sudo is unavailable. Rebuild with `pnpm start` from a terminal with Docker access. The prior report job is marked uncertain by the generic queue although its office event records a rejected request; it was not blindly retried or marked successful. Assignment synchronization separately needs a retained photo linked to the source report. No reset or real request send was performed. No new dependencies or configuration names were added. FEEDBACK.md was absent.
