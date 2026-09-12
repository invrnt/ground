# Report providers

Set `AI_PROVIDER=openrouter` or `AI_PROVIDER=vercel` on the server. An unset selector defaults to OpenRouter. Empty or other values disable interpretation and appear as configuration problems in operations/preflight. No fallback between gateways occurs. Configure only the selected provider:

| Selector | Required environment variables |
| --- | --- |
| `openrouter` | `OPENROUTER_API_KEY`, `OPENROUTER_TRANSCRIPTION_MODEL`, `OPENROUTER_INTERPRETATION_MODEL` |
| `vercel` | `AI_GATEWAY_API_KEY`, `AI_GATEWAY_TRANSCRIPTION_MODEL`, `AI_GATEWAY_INTERPRETATION_MODEL` |

Model IDs are explicit, with no defaults or translation between catalogs. `FFMPEG_PATH` remains optional. Direct OpenAI credentials do not activate interpretation. Use the same configuration for API and worker and restart both after changing it. Previously stored transcripts and extractions retain their provider metadata and are reused by the existing workflow; switching does not reprocess completed reports. An unfinished report can therefore contain transcription and extraction evidence from different gateways.

The adapter is `packages/server/src/adapters/report-provider/`. It uses native fetch and the existing Zod/schema tooling, with no additional SDK. Shared prompts, local schema validation, media preparation and domain workflow remain common to both transports.

## OpenRouter

Official documentation retrieved on 2026-09-12: [speech-to-text](https://openrouter.ai/docs/guides/overview/multimodal/stt), [images](https://openrouter.ai/docs/guides/overview/multimodal/images), [PDFs](https://openrouter.ai/docs/guides/overview/multimodal/pdfs), [structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs).

Transcription uses `POST https://openrouter.ai/api/v1/audio/transcriptions` with JSON `input_audio` containing raw WAV base64, `language: es` and `response_format: json`. Extraction uses `/api/v1/chat/completions`, `response_format.json_schema` with `strict: true`, `provider.require_parameters: true`, and the `file-parser` plugin's `native` PDF engine. Select a model supporting image, native file and structured outputs. There is no implicit OCR fallback.

The earlier public catalog check listed `openai/whisper-1` and `openai/gpt-4.1-mini` as examples, not configured defaults or proof of account access. Refresh the catalog before choosing models. Account access and extraction quality remain pending live checks.

## Vercel AI Gateway

Official documentation retrieved on 2026-09-12: [speech-to-text](https://vercel.com/docs/ai-gateway/modalities/speech-to-text), [chat API](https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions), [images and PDFs](https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions/images), [JSON Schema](https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions/structured-outputs), [generation usage](https://vercel.com/docs/ai-gateway/observability-and-spend/usage).

Transcription uses `POST https://ai-gateway.vercel.sh/v4/ai/transcription-model` with Bearer authorization and these protocol headers: `ai-gateway-protocol-version: 0.0.1`, `ai-transcription-model-specification-version: 4`, and `ai-model-id` set to the configured transcription model. The JSON body contains `audio` as raw WAV base64 and `mediaType: audio/wav`. It does not send OpenRouter's `input_audio`, `language` or `response_format`. The model detects the language; Spanish transcription quality must be checked with the selected model. The response supplies `text`; empty text is rejected.

Speech-to-text is beta with gradual account rollout. A configured key is not evidence that the account has access. The documented REST endpoint avoids adding AI SDK dependencies. Do not substitute an assumed `/v1/audio/transcriptions` endpoint or multipart upload.

Extraction uses `POST https://ai-gateway.vercel.sh/v1/chat/completions`. Images and PDFs use the same private base64 content blocks as OpenRouter. Select a model with image and PDF input and JSON Schema output. OpenRouter routing/plugin fields are omitted. Vercel receives the documented `response_format.json_schema` object; its documentation does not specify the `strict` flag, so the adapter does not send it or claim equivalent provider-side enforcement. The full strict local Zod validation remains mandatory. Refusal, truncation or invalid output cannot become commands.

## Limits, retries and evidence

Original private files and hashes remain intact. ffmpeg produces the recorded WAV derivative with the existing 60-second and 10 MB input limits. PDFs remain limited to five pages and 10 MB; private images and PDFs are sent inline, not published at accessible URLs.

Each HTTP call has a 30-second timeout and no internal retry. HTTP 408/429/5xx and network failures are classified transient; other HTTP failures are classified permanent. Error messages never include raw provider bodies. The existing durable queue controls bounded attempts and can also retry permanent failures for read/inference jobs; this migration does not alter that queue policy. Inference retries may incur another charge. Existing operation keys and server validation prevent duplicate domain effects. No provider call occurs inside a database transaction.

Metadata records `openrouter` or `vercel`, any returned upstream provider, model, request ID when available, duration, usage and prompt/schema versions. Historical entries without a provider remain attributed to OpenAI in exports. OpenRouter's supplied numeric cost is retained. Vercel costs remain null because this adapter does not query its separate generation usage API; token counts do not imply an exact billed cost. Missing IDs, upstream providers and costs remain unknown. All configured gateway keys are included in export redaction by value.

Controlled HTTP checks cover both transports, selected configuration, multimodal request shape, failure rejection, historical attribution and key redaction. No live account result is claimed. Once credentials and models are available, run one bounded Spanish audio and image/PDF extraction check for Vercel and record model support, quality and any unsupported options. No full demo replay is required solely for switching transports.
