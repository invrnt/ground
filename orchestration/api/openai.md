# OpenAI adapter

Retrieve the official [file transcription](https://developers.openai.com/api/docs/guides/speech-to-text), [image input](https://developers.openai.com/api/docs/guides/images-vision), [structured output](https://developers.openai.com/api/docs/guides/structured-outputs) and [file input](https://developers.openai.com/api/docs/guides/file-inputs) guides before pinning models and SDK calls. These pages were retrieved on 2026-09-12. Availability in the team's account is untested.

Use one server SDK client. The local methods are `transcribeAudio({file, languageHint})` and `interpretReport({text, transcript, attachments, scopedContext, schemaVersion})`. Configure `OPENAI_TRANSCRIPTION_MODEL` and `OPENAI_INTERPRETATION_MODEL` separately. Do not invent model IDs or assume every model supports audio, vision and structured output.

The interpretation result follows the shared schema and contains proposed operations, resolved references, evidence and missing fields. Ground computes quantities, money and dates after validating the model's extracted meaning. The adapter never calls domain mutations, Telegram dispatch or Ambiguous directly.

Check media formats against the selected model. Telegram voice formats may need a supported conversion; preserve the original file and hash and record the derivative. PDFs must pass the five-page/10 MB application limits before submission. Keep media private; use supported bytes/files rather than making public URLs just for a model call.

Record transcript, model and prompt/schema versions, provider request ID, duration and supplied usage/cost. Handle refusal, malformed/incomplete response, timeout and missing references as explicit recoverable results. A failed extraction cannot become a successful zero-value command.

Select models with one small check using the canonical audio/photo and invoice. Under the user's testing reduction, do not run a multi-model benchmark or twenty-input evaluation campaign. Document the chosen identifiers and any untested formats.
