# OpenRouter interpretation

Configure OPENROUTER_API_KEY, OPENROUTER_TRANSCRIPTION_MODEL and OPENROUTER_INTERPRETATION_MODEL on the server. Model IDs are required; there is no inferred fallback. FFMPEG_PATH remains optional. Direct OpenAI credentials no longer activate interpretation.

Official documentation retrieved on 2026-09-12: [speech-to-text](https://openrouter.ai/docs/guides/overview/multimodal/stt), [images](https://openrouter.ai/docs/guides/overview/multimodal/images), [PDFs](https://openrouter.ai/docs/guides/overview/multimodal/pdfs), [structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs).

Audio uses POST /api/v1/audio/transcriptions with JSON input_audio containing raw WAV base64, language es and response_format json. The original private file and hash remain intact; bounded ffmpeg conversion produces the recorded derivative (60 seconds, 10 MB input). Responses retain text, reported usage/cost and X-Generation-Id when supplied.

Extraction uses POST /api/v1/chat/completions with private base64 image_url and file content, strict JSON Schema generated from the shared local extraction schema, and provider.require_parameters=true. JSON is parsed and validated locally. PDF limits remain five pages/10 MB. file-parser engine native requires a model with native file support; no implicit OCR/text-only fallback discards visual context. Select a model supporting image, file, response_format and structured_outputs.

The public model catalog was read without credentials on 2026-09-12. It listed openai/whisper-1 for transcription and openai/gpt-4.1-mini with image/file input and structured_outputs. These are examples of catalog compatibility, not configured defaults or proof of account access. Refresh GET /api/v1/models?output_modalities=transcription and GET /api/v1/models before choosing models. Account availability, Spanish transcription quality, image/PDF extraction and billing remain pending credentials and one bounded live check.

The HTTP client has a 30-second timeout and no automatic retries. Durable read/inference jobs retain bounded retries for network/timeouts, HTTP408/429/5xx. Authentication/configuration errors do not retry automatically; refusals, malformed or incomplete output never become commands. Inference retries can incur another provider charge, but the existing operation keys prevent duplicate domain effects. No external call occurs in a DB transaction.

New metadata names OpenRouter as the gateway and separately records any returned upstream provider. It preserves model, request ID, usage/cost, duration and prompt/schema versions. Historical metadata without a provider remains attributed to OpenAI in exports. Missing cost stays unknown. Provider response bodies, source content and credentials are not added to error logs.
