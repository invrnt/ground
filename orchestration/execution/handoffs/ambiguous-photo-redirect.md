# Ambiguous photo verification

Base: `129fe9e`. The latest run had a linked and retained Telegram photo, a synced report, and failed photo/task synchronization. The photo had already been uploaded: reading its authenticated content endpoint returned HTTP 302 to storage.googleapis.com. The adapter rejected redirects and reported `Remote evidence verification failed`.

The verifier now accepts one HTTPS redirect to exactly storage.googleapis.com, without URL credentials or a custom port. It sends no Ambiguous authorization headers to storage, rejects further redirects and retains the shared timeout, byte limit, length and SHA-256 checks. No original media or credentials were changed.

Validation: server typecheck passed; five focused tests passed for redirect handling, credential isolation, untrusted destinations and content mismatch. Read-only verification of the existing real photo returned true without another upload. No new dependencies or configuration names. The public OpenAPI describes the content endpoint as proxying bytes; the real response established its redirect behavior. Deployment and recovery outcomes will be recorded after verification.

Deployment and recovery: rebuilt Docker; API and worker health passed. Requeued the failed photo job with PgJobQueue.retryKnown after verifying its existing remote bytes. The coordinator reconciled that photo and woke assignment synchronization. The active run's file, task and document reached synced with no last_error; a subsequent query found no failed jobs in the active run. No second photo upload, reset or quotation send was performed. The image also includes English replies from `129fe9e`.

Build speed follow-up: Dockerfile now installs from the root and all six workspace manifests before copying application code. Source-only edits can reuse the dependency layer. `docker build --check .` passed without warnings; referenced manifests exist. This new cache layout has not been built yet, so its first build will populate the dependency cache. No timing improvement is claimed as measured. FEEDBACK.md was absent.
