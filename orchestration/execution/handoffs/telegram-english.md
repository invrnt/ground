# English Telegram replies

Base commit: `8626133`. The user changed the language requirement to English for Telegram responses. AGENTS.md now records this override; PRD.md is unchanged.

Translated acknowledgements, committed summaries, clarification guidance, intake/provider errors, follow-up reminders and newly prepared quotation requests. Channel queries now use the existing English renderer. The extraction prompt requests English clarification questions even for Spanish input, with prompt version `ground-interpretation-v2-en`. Original messages, transcription language, stored evidence, entity references and existing approved payloads remain unchanged.

Checks: server typecheck passed; targeted provider and ingestion tests passed, 24 tests with one PostgreSQL case skipped because TEST_DATABASE_URL was not configured. Updated the existing provider-error assertion. `git diff --check` passed. No new dependencies or environment variables. FEEDBACK.md was absent. No live Telegram message was sent during verification. Previously queued reply text and pending clarification text remain historical data and are not translated in place.
