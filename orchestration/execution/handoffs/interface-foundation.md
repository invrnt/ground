# Interface foundation handoff

Stage 2 base `3831f57`; merged runtime base `a0f01c7`. Contribution is the commit containing this handoff.

Implemented owned shared controls, styles, sign-in UI, API helper and formatters. Shared root registration remains runtime's responsibility. No feature cards, domain calculations, provider calls, schema copies or global stores were added. No FEEDBACK.md was present; the Orchestrator reported no feedback at assignment.

## Integration contract

Import `apps/web/src/styles/global.css` once at the web entrypoint. `features/auth/index.tsx` exports `AuthBoundary`, `LoginPage`, `SignOutButton`, `ForbiddenState` and `safeReturnPath`. AuthBoundary children receive the shared Session DTO. Login uses POST `/api/session`, session restore uses GET, logout uses DELETE with X-CSRF-Token. Session uses user identity/roles, project_ids and csrf_token as agreed with runtime. The schema belongs to contracts.

`ui/index.ts` exports Button, Card, Field, Panel, StatusBadge, SourceLink, EvidenceLink, EmptyState, ErrorState, LoadingState and WorkspaceShell. Shell accepts projectName, runLabel, connection, children, optional activity and account. Its Recording view enlarges active content to 24 px or more and focuses the main card area. It supplies no hardcoded project metrics. Feature owners supply real data and cards.

Use `apiRequest(path, {schema, method, body, csrfToken, idempotencyKey, signal})` from lib/api-client.ts. Responses parse through a caller-supplied shared schema. Errors become ApiRequestError with shared error detail and HTTP status. Requests stay on local `/api/`, include same-origin credentials, and mutations include an Idempotency-Key. No automatic retries. Callers must retain their explicit operation key when offering a retry after uncertainty. Do not construct an external provider request in the browser.

Formatters use en-GB, America/Bogota by default, explicit COP, and string grouping that preserves all decimal digits. Null money is `Price to confirm`; null quantities are unknown. Dates use scenario values supplied by callers. Formatting performs no stock, price or procurement calculations.

Native modal dialog supplies focus containment, Escape handling and return focus. Source links allow only HTTP(S), omit URL credentials and use noopener/noreferrer. Evidence links route through authenticated Ground endpoints. Safe return paths must belong to one of the session's project IDs; server authorization remains required.

## Checks

Runtime merged. Final `pnpm --filter @ground/web typecheck` and `pnpm --filter @ground/web build` passed. Login page loaded through the real runtime GET /api/session denial in an isolated PostgreSQL schema and rendered correctly. Chrome extension UI interrupted automation during form submission, so successful browser sign-in is unverified. The Orchestrator explicitly accepted runtime's completed session checks plus this layout inspection for the minimal gate. Temporary fixture API and preview web servers were stopped. Shared control layout manually inspected in Chrome at 1920×1080 recording mode and 390×844 narrow width, with no horizontal overflow. Modal opened with focus on Close, keyboard navigation stayed in the dialog, Escape closed it and focus returned to its trigger. Visible focus ring inspected. Temporary preview files were removed. Initial scoped typecheck found only missing shared Session/sessionSchema exports; those resolved after runtime integration. No new tests were added, per the required minimal presentation workflow.

Token contrast calculation: main text on white 16.54:1; secondary text 6.61:1; primary white text 7.87:1; warning 6.77:1; error 6.68:1. All exceed 4.5:1. Reduced-motion CSS disables animation and transitions.

## Versions and sources

No dependency or manifest changes. Uses foundation-pinned React 19.3.0 and TypeScript 5.9.3. Verified current official React input documentation for controlled/uncontrolled semantics, useId associations and form handling; MDN dialog documentation for showModal and native keyboard focus; MDN Intl.NumberFormat format documentation for exact numeric-string handling. Formatting uses string grouping rather than converting decimals to Number.

Sources: https://react.dev/reference/react-dom/components/input, https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/format.

No new configuration names. Authentication, permissions, CSRF verification and resource-level access are server responsibilities. The UI is not an authorization boundary.
