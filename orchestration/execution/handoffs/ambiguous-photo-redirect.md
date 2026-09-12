# Ambiguous photo verification

Base: `129fe9e`. The latest run had a linked and retained Telegram photo, a synced report, and failed photo/task synchronization. The photo had already been uploaded: reading its authenticated content endpoint returned HTTP 302 to storage.googleapis.com. The adapter rejected redirects and reported `Remote evidence verification failed`.

The verifier now accepts one HTTPS redirect to exactly storage.googleapis.com, without URL credentials or a custom port. It sends no Ambiguous authorization headers to storage, rejects further redirects and retains the shared timeout, byte limit, length and SHA-256 checks. No original media or credentials were changed.

Validation: server typecheck passed; five focused tests passed for redirect handling, credential isolation, untrusted destinations and content mismatch. Read-only verification of the existing real photo returned true without another upload. No new dependencies or configuration names. The public OpenAPI describes the content endpoint as proxying bytes; the real response established its redirect behavior. Deployment and recovery outcomes will be recorded after verification.
