# Error contract

An HTTP error is `{ error: { code, message, retryable, operation_id, details }, request_id }`. IDs and details may be null. Messages are safe for users; logs retain a redacted diagnostic. `details` contains allowed field errors, current version or required action, never secrets or another project's data.

| Code | HTTP | Required handling |
| --- | --- | --- |
| `INVALID_INPUT` | 400 | Show precise invalid field; no effects |
| `UNAUTHENTICATED` | 401 | Login/renew session; preserve safe return path |
| `FORBIDDEN` | 403 | Explain unavailable action without disclosing restricted data |
| `NOT_FOUND` | 404 | Missing or invisible resource |
| `VERSION_CONFLICT` | 409 | Reload snapshot and re-evaluate; do not blind-retry approval |
| `DUPLICATE_MISMATCH` | 409 | Same idempotency key with different payload; require review |
| `INSUFFICIENT_STOCK` | 422 | Preserve proposal as needs_input; show available quantity |
| `NEEDS_CLARIFICATION` | 422 | Ask bounded question or selection |
| `UNSUPPORTED_MEDIA` | 415 | State permitted formats and preserve accepted message metadata |
| `FILE_TOO_LARGE` | 413 | Enforce 10 MB without fetching excess bytes |
| `DOCUMENT_UNREADABLE` | 422 | Keep allowed original and request missing fields |
| `DECISION_EXPIRED` | 410 | Show expiry and obtain a fresh checkpoint/version |
| `APPROVAL_STALE` | 409 | Present changed facts; require fresh approval |
| `RUN_RETIRED` | 409 | Reject old-run action and link to active run |
| `PROVIDER_UNAVAILABLE` | 503 | Durable known-failure retry if safe |
| `PROVIDER_TIMEOUT` | 504 | Read retry or write reconciliation according to outcome |
| `SEND_UNCERTAIN` | 409 | No automatic resend; show reconciliation task |
| `REMOTE_UNCERTAIN` | 409 | Reconcile ID/marker or manual review |
| `NEEDS_CONFIGURATION` | 503 | Name missing capability or mapping, without credentials |
| `NOT_READY` | 503 | Feature slot not implemented; development-only visibility |
| `RATE_LIMITED` | 429 | Honor bounded retry-after |

Duplicate requests with identical inputs return the prior result as success. A known already-applied operation is not a failure. Async errors also persist on the input/job/activity and emit a safe event; an HTTP disconnect must not erase them.

Provider adapters normalize failures into `known_not_applied`, `possibly_applied` or `read_failure`. Only `known_not_applied` and safe reads can enter ordinary retry. Do not collapse uncertainty into a generic retryable exception.
