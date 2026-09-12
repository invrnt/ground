# Interpretation handoff

Stage 3 base `be846e5`. Merged shared checkpoint `0cfd7bd` and site/schema contribution `d769512` before final checks. Contribution commit is the commit containing this handoff. Edited only `adapters/openai`, `modules/interpretation` and this handoff. Root FEEDBACK.md is absent; Orchestrator reported no PR feedback.

Implemented one configured OpenAI SDK client with separate transcription and interpretation model names, disabled SDK retries, a 30-second provider timeout, structured parsing, private inline image/PDF input and explicit refusal/incomplete/malformed/error handling. No model ID is hardcoded. Provider metadata retains request ID, supplied usage, model, duration, prompt/schema version and unknown cost as null. No source text or provider error dumps enter logs.

Audio is decoded by a fixed ffmpeg command into bounded 16 kHz mono WAV, with 10 MiB input, 60-second duration and 15-second conversion bounds. Private originals remain unchanged. The derived WAV, hash and source relationship are retained. PDF input is checked for readability and five pages before submission. Interpretation combines the input with already-retained media on its explicit report thread. A photo arriving after interpretation remains intake's attachment synchronization operation and cannot replay consumption.

Structured extraction contains only allowed command types, candidate entity references, field JSON, at most two missing-field questions, query intent and explicit receipt classification. Server code resolves exact aliases and IDs against the scoped canonical snapshot, resolves scenario-relative dates in America/Bogota, supplies evidence and document hashes, and validates every dispatched proposal with the shared operation schema. Field JSON is a representation for the structured model boundary, not an unchecked execution payload. Models cannot select identity, permissions, tools or send recipients. The site service remains responsible for balances and command permissions.

Each independent command commits through SiteCommandService with its source input UUID and a stable command/revision key. The same transaction checkpoints the validated proposal and result. Retries skip committed command outcomes. If a clarification changes an already-applied command, it requires an explicit correction rather than applying another effect. A failed issue or unresolved reference does not roll back independent work. New issue IDs flow from the committed result into assignment commands.

Clarifications retain allowed author/supervisor IDs, expected version, 30-minute expiry, token hash and a two-question limit. Telegram receives a Spanish prompt and a bounded reply code. The same answer method handles authenticated web answers and authorized Telegram replies/callbacks. Repeated answers reuse the persisted result and one resume job. Expired or changed-version answers require supervisor review. Unresolved inputs remain visible; completed commands stay recorded. Model/provider failures retain retryable state and originals.

Query and purchase/receipt intents are produced but call injected registered services. Missing reporting/purchase handlers remain `pending_handler` with NOT_READY rather than claiming completion. The reporting owner supplies `QueryPort`; site registration later delegates purchase/receipt commands to the purchase owner.

## Integration exports

- `OpenAIReportAdapter({ api_key, transcription_model, interpretation_model, ffmpeg_path? }, files)` exposes `transcribeAudio` and `interpretReport`, using one SDK instance. An optional injected client supports controlled local boundary checks.
- `InterpretationRepository(transactions)` uses shared migration 005 and owns interpretation records/clarifications. It only reads scoped intake rows to combine linked evidence.
- `InterpretationWorkflow({ transactions, repository, intake, replies, projects, commands, queue, files, adapter, queries? })` exposes `process`, `answer`, `route` and `transcriptForInput(context, inputId, tx?)`.
- `interpretationModule(workflow, sessions)` exports `process_input` and `POST /api/projects/:p/clarifications/:id/answer`; the route uses shared `clarificationAnswerInputSchema`, session/project access and CSRF checks.
- Wire intake's `AuthorizedReplyRouter` to `workflow.route` through a closure during composition construction. Interpretation has no Telegram client or direct send.
- Live evidence can inject `transcriptForInput` to retrieve only persisted scoped transcripts. Use the original ingestion input UUID, not the transcript UUID, for that lookup.

## Checks and outcomes

- `pnpm --filter @ground/server typecheck`: passed after the merged shared/site contributions.
- A temporary bounded inspection, removed after execution, used synthetic audio/photo/PDF bytes and explicit SDK response fixtures. It exercised real ffmpeg, the pinned OpenAI SDK parser, runtime's isolated PostgreSQL schema, intake repositories, canonical snapshot and SiteService. The report produced 81% progress, stock 0, need 20 and Juan due `2026-09-13T14:00:00.000Z`. Replaying the job did not add provider calls or site operations.
- The same inspection parsed invoice intent, ambiguous input, malformed output and refusal. Invoice remained register_purchase; no receipt or purchasing result was invented. Wrong clarification token was denied; repeated valid answers created one resume job. The fixture schema was dropped afterward.
- These are deterministic boundary/integration observations, not model extraction accuracy or real sponsor evidence. No paid/provider calls ran. No separate benchmark or broad test suite was added.
- Real canonical audio/photo extraction, real invoice extraction and selected account model capability remain pending user credentials and model configuration. No live Stage 3 acceptance claim. Combined stage gate belongs to the shared owner.

## Versions and documentation

OpenAI SDK 7.15.0 was verified through npm metadata and added by the shared owner. Reused Zod 3.25.76, pdf-lib 1.17.1, pg 8.23.0 and TypeScript 5.9.3. Shared owner added ffmpeg to the Docker runtime. Local inspection used the installed ffmpeg binary; deployment/container execution is untested here.

Official documentation retrieved on 2026-09-12: [file transcription](https://developers.openai.com/api/docs/guides/speech-to-text), [images and vision](https://developers.openai.com/api/docs/guides/images-vision), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [file inputs](https://developers.openai.com/api/docs/guides/file-inputs). Verified `audio.transcriptions.create`, `responses.parse`, `zodTextFormat`, `output_parsed`, refusal content, response completion status, private base64 image/file content and SDK request metadata. WAV conversion avoids assuming the selected transcription model accepts Telegram Ogg directly.

Configuration uses OPENAI_API_KEY, OPENAI_TRANSCRIPTION_MODEL, OPENAI_INTERPRETATION_MODEL and optional FFMPEG_PATH. The model names must be supplied and capability-checked later; no fallback invents an account model. Existing TEST_DATABASE_URL was used only through the isolated schema fixture. No credentials persisted.
