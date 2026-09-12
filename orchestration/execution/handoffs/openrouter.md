# OpenRouter migration

Base fed6d209255fc68eaeeab0482a2d6d82f6756cc6. Contribution commit is the commit containing this handoff. Orchestrator granted exclusive provider migration plus shared dependency/configuration/ownership paths; recorded in ownership.md. Prior owners inactive. No secrets, PRD, prior handoffs or recorded baseline evidence changed. Parent reported no PR feedback; no FEEDBACK.md requested or created.

The active adapter is OpenRouterReportAdapter in adapters/openrouter. Native fetch replaces direct OpenAI SDK transport. Audio uses the documented JSON /audio/transcriptions endpoint; extraction uses /chat/completions with strict JSON Schema, local Zod validation, image_url and file content. PDF engine native explicitly requires visual/native-file model capability; there is no silent OCR fallback. Existing ffmpeg WAV conversion, 60-second/10 MB audio limits, five-page/10 MB PDF limits, private originals/derivatives and interpretation domain policy remain intact. Commands still pass the existing transactional validation and operation-key deduplication.

Composition and operations/preflight require OPENROUTER_API_KEY, OPENROUTER_TRANSCRIPTION_MODEL and OPENROUTER_INTERPRETATION_MODEL. Optional FFMPEG_PATH remains. No model default is invented. Legacy OPENAI_* settings no longer enable workflow. The unused generic OpenAIAdapter port is renamed ReportInterpretationAdapter. New metadata explicitly records gateway openrouter, optional upstream provider, model, request/generation ID, duration, supplied usage/cost and prompt/schema versions. Exports preserve historical missing-provider records as openai, retain provider-specific model keys, and keep unknown costs null. Historical OPENAI_API_KEY redaction remains alongside OPENROUTER_API_KEY redaction.

HTTP timeout is 30 seconds with no implicit client retries. Existing durable jobs may retry inference network/timeouts or HTTP408/429/5xx; this can repeat inference billing but cannot duplicate canonical domain operations. Authentication errors, unsupported models, refusal, incomplete/malformed output do not yield commands. Error bodies and source data are not exposed through provider errors.

Verified official docs on 2026-09-12: [STT](https://openrouter.ai/docs/guides/overview/multimodal/stt), [images](https://openrouter.ai/docs/guides/overview/multimodal/images), [PDF](https://openrouter.ai/docs/guides/overview/multimodal/pdfs), [structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs). STT uses raw base64 input_audio and X-Generation-Id; chat uses nested file/image content, response_format.json_schema and provider.require_parameters. Public model catalog GET /api/v1/models and transcription filter were read without a key: openai/whisper-1 and openai/gpt-4.1-mini were listed, with native image/file and structured output on the latter. These are documentation examples, not configured defaults or account verification.

Removed direct openai 7.15.0 server dependency; transitive SDKs used by other packages remain. Added pinned zod-to-json-schema 3.25.1; reused Zod3.25.76, pdf-lib1.17.1 and TypeScript5.9.3. Current release version inventory and runbook reflect migration; historical release JSON remains unchanged.

Checks:
- pnpm install --frozen-lockfile --reporter=silent — passed after dependency update.
- pnpm exec vitest run packages/server/src/adapters/openrouter/openrouter.critical.test.ts — 11 passed. Controlled HTTP responses verify native STT route/body/metadata, image/PDF/schema request contract, HTTP retry classification, refusal/truncation/malformed/200-error handling, historical/new attribution and token redaction. Audio conversion is mocked in this HTTP test; unchanged ffmpeg behavior was not rerun.
- pnpm --filter @ground/contracts typecheck — passed.
- pnpm --filter @ground/server typecheck — passed.
- pnpm --filter @ground/server build — passed.

No broad suite or live paid inference ran. User supplies credentials later. Pending: selected models' account access, Spanish audio quality, photo/PDF extraction quality and actual billing in one bounded configured live check. Public catalog compatibility and fixture success do not prove those outcomes.

Integration and feedback: Orchestrator confirmed contribution d3aba84 merged into main with a clean checkout. Its successful post-merge GitHub review of invrnt/ground returned an empty all-state PR list (limit 20); FEEDBACK.md was absent. No actionable repository feedback was found. This documentation-only follow-up adds that result; no tests were repeated.
