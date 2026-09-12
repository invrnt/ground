# AI Gateway selection handoff

Base: `main` at `4e782e2`, clean when inspected. Implementation commit: `710015f`. Branch: `codex/ground-ai-gateway`. Worktree: `/home/jc/dev/hackathons/ground-worktrees/ai-gateway`. The Orchestrator merged through `1333893` onto main; final integration and feedback status are recorded below.

## Delivered

The neutral `adapters/report-provider` adapter uses one prompt, extraction schema, media pipeline and response validation with explicit OpenRouter/Vercel HTTP variants. `AI_PROVIDER` defaults to `openrouter` when unset; `vercel` selects AI Gateway. Invalid selectors and missing selected credentials disable interpretation and appear in operations/preflight. The inactive provider's configuration is not required. API and worker must restart together after a switch. Existing stored transcripts, extracted results and domain operation keys remain unchanged.

OpenRouter retains its JSON audio endpoint, Spanish language hint, required schema routing and native PDF plugin. Vercel uses its documented v4 transcription endpoint/protocol and v1 chat endpoint, with image/PDF content and JSON Schema. No guessed OpenAI audio endpoint, extra SDK, model default or cross-gateway fallback was added. The 60-second audio/10 MB limit, five-page PDF limit, ffmpeg WAV conversion and private original/derivative storage remain unchanged.

Operations attributes new Vercel responses as `vercel`, preserves historical `openai` and `openrouter` attribution and records transport versions. Vercel cost remains null; no extra billing lookup is performed. Redaction includes the configured AI Gateway key by value, independent of token prefix. Error messages omit raw provider bodies. No credentials were read or used.

Owned changes include the neutral adapter/configuration and focused HTTP checks, interpretation imports, composition, operations status/export/redaction, `.env.example`, README, runbook, current provider contract, repository structure and temporary ownership grant. No PRD, previous handoffs or recorded release evidence was changed. FEEDBACK.md was absent at start and before handoff.

## Checks

- `pnpm exec vitest run packages/server/src/adapters/report-provider/report-provider.critical.test.ts`: passed, 22 tests. Covers provider selection, OpenRouter and Vercel STT contracts, multimodal/schema requests, invalid/refused/truncated responses, HTTP classification/no internal retries, historical export attribution and key redaction.
- `pnpm --filter @ground/server typecheck`: passed.
- `pnpm typecheck`: passed across workspaces and probes.
- `git diff --check`: passed before commit.
- Read-only search found no old adapter class/path references under packages, apps, tools or scripts.

The worktree's first pnpm invocation materialized dependencies from the existing lockfile. Manifests and lockfile are unchanged. No broad test suite, build, database test or live provider call was run for this transport/configuration change. HTTP tests mock unchanged ffmpeg conversion; no new media conversion claim is made.

## Configuration and versions

New names: `AI_PROVIDER`, `AI_GATEWAY_API_KEY`, `AI_GATEWAY_TRANSCRIPTION_MODEL`, `AI_GATEWAY_INTERPRETATION_MODEL`. Existing `OPENROUTER_*` variables and optional `FFMPEG_PATH` are retained. Values belong only in server process configuration. API and worker use the same configuration reader; preflight consumes operations status without another provider selector.

No dependency additions/upgrades. Existing relevant versions: TypeScript 5.9.3, Zod 3.25.76, zod-to-json-schema 3.25.1, pdf-lib 1.17.1, Vitest 3.2.7. Vercel STT REST versions: path `/v4/ai/transcription-model`, protocol `0.0.1`, transcription specification `4`. Chat REST remains v1 for both gateways.

Official documentation inspected on 2026-09-12: [Vercel STT](https://vercel.com/docs/ai-gateway/modalities/speech-to-text), [chat API](https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions), [image/PDF](https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions/images), [JSON Schema](https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions/structured-outputs), [generation lookup](https://vercel.com/docs/ai-gateway/observability-and-spend/usage), [OpenRouter STT](https://openrouter.ai/docs/guides/overview/multimodal/stt), [OpenRouter PDF](https://openrouter.ai/docs/guides/overview/multimodal/pdfs) and [OpenRouter schema](https://openrouter.ai/docs/guides/features/structured-outputs).

## Pending and limitations

- Live provider account access and quality are pending credentials, per the user's override. Vercel says STT is beta and rolling out per account. No capability result is claimed for this account.
- Vercel STT uses the documented body with audio and mediaType, allowing model language detection. Spanish transcription quality requires one bounded live check. No undocumented language option is forwarded.
- Vercel's JSON Schema documentation does not specify `strict`; the adapter omits that OpenRouter field. Full local strict Zod validation remains mandatory. Select a model supporting image, PDF and schema output, then verify its response with a bounded live check. Provider-side enforcement equivalence is not claimed.
- Vercel IDs/upstream information are recorded only if returned in recognized fields/headers. Costs remain unknown without a separate generation lookup; token usage is not a cost estimate.
- Adapter requests have a 30-second timeout and no internal retries. Existing queue behavior, including bounded retries of some permanent inference failures, is unchanged and documented accurately. No external-send retry policy was touched.
- Provider selection applies on restart; a partially processed report can retain a transcript from one gateway and use the other for subsequent extraction. Metadata is per operation and remains accurate.


## Final integration and feedback record

The Orchestrator reported the implementation and initial handoff merged through `1333893` onto main. The subsequent human commit `1ab2394`, updating AGENTS.md and the submission checklist, was preserved. This worktree rebased onto main without conflicts, and the updated root rules and `docs/release/submission.md` were read before this final documentation update.

The Orchestrator resolved and inspected the actual GitHub repository [invrnt/ground](https://github.com/invrnt/ground) after integration. Its successful all-state PR query, limit 20, returned no PRs; there were no PR descriptions, reviews, comments or diffs to assess, and no feedback fixes or deferrals. This records the Orchestrator's review, not an independent duplicate query by this implementation agent. FEEDBACK.md remained absent.

Only this handoff changed after the rebase. No additional tests were run, as requested; the checks above remain the implementation evidence. Live provider checks, eligibility verification, recording and final hackathon submission remain pending. Completing this provider-selector change does not complete those checklist items.
