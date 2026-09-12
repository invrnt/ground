# Telegram intake handoff

Stage 1 base `3831f57`; rebased by fast-forward onto merged runtime `a0f01c7`. Contribution commit is the commit containing this handoff. Only Telegram adapter, ingestion module and this handoff were edited. No FEEDBACK.md was present; Orchestrator confirmed no new feedback at handoff.

Implemented the sole configurable Bot API client, secret-header verification, normalized author/message/reply identity, 10 MiB intake and streamed download limits, 60-second provider audio metadata limit, PDF signature/readability/five-page check, content hashes and private evidence metadata. Allowed PDF originals remain available when readability fails. Tokens stay in the adapter configuration and never enter provider errors or persistence.

Webhook acceptance commits authorized project/run binding, input/update identities, event and outbox before returning. The active run creation time fences delayed inputs. PostgreSQL project/run locks and unique provider keys prevent duplicate jobs under concurrent delivery. Explicit reply photos preserve their own sender and join the original report, including replies to confirmed bot receipts. Unlinked photos wait for an explicit clarification. `linkAttachment` permits the later interpretation owner to complete that association without replaying domain operations.

Receipts and media processing use separate durable jobs. `send_channel_reply` with condition `intake_media` downloads originals and schedules `process_input` only after storage. Linked late photos schedule `sync_attachment` without scheduling the original operation again. Ordinary `send_channel_reply` jobs retain send state before the provider call; an interrupted or uncertain attempt cannot automatically resend. Telegram known failures expose a bounded `retry_after_ms`; runtime will honor it during integration.

`enqueueReply`, `enqueueCommittedSummary` and `AuthorizedReplyRouter` are the later-stage integration ports. Summary input accepts committed counts and project version, with no cost, address or approval fields. Interpretation owns clarification decisions and responder scopes; dispatch owns authorized recipient reply semantics. The router receives an already authorized persisted input and transaction, and must commit any handled result there. It is intentionally unconfigured in Stage 2. No extraction or commercial dispatch is implemented here.

## Registrations

- `BotTelegramAdapter({ token, webhook_secret })` implements frozen `TelegramAdapter.getFile/send`, plus `verifyWebhook`, `inspectUpdate`, `normalizeUpdate`, `downloadFile`, `sendMessage`, `answerCallback`.
- `PgIngestionRepository(tx => transactions.client(tx))` uses merged runtime schema and the canonical transaction connection.
- `IngestionService({ bot_id, adapter, repository, transactions, queue, files, router? })`. `bot_id` must be the bot's nonsecret numeric identity, never the token.
- `ingestionModule(service)` exports `POST /webhooks/telegram` and the `send_channel_reply` job handler for composition. All routes/job registrations remain owned by runtime.
- New input job subject IDs are ingestion input UUIDs. Interpretation reads them through `repository.getInput(id, tx)`; media descriptors include private evidence UUIDs. Callback data is retained separately in `StoredInput.callback` and must be authorized by clarification before use.

## Checks

- `pnpm --filter @ground/server typecheck`: passed.
- `TEST_DATABASE_URL=<isolated local PostgreSQL connection> pnpm exec vitest run packages/server/src/modules/ingestion/ingestion.critical.test.ts`: all three checks passed against runtime's unique-schema fixture. Tests cover concurrent triple delivery, late photo association and author, one media retention/hash/metadata/sync job, no repeated processing, unknown sender/bad secret and pre-run input rejection, and uncertain receipt replay denial. Schema cleaned up by the shared fixture.
- The same file has two typed-double checks usable without PostgreSQL. Its database case is explicitly skipped unless TEST_DATABASE_URL is supplied. Default tests make no provider calls.
- No live Telegram acceptance or acknowledgement performed. Pending bot token, webhook secret, configured authorized group/member IDs and reachable demo conversation. Credentials are deferred by user instruction. No provider send, merchant contact or fixture claim of live acceptance.
- Combined stage `pnpm check`, route registration and real provider checks belong to runtime/Orchestrator integration. No broad test suite or performance claim added.

## Versions and retrieval

Reused pinned TypeScript 5.9.3, Zod 3.25.76, pg 8.23.0, Fastify 5.12.4, pdf-lib 1.17.1 and Vitest 3.2.7. No dependency or manifest changes.

Official [Telegram Bot API](https://core.telegram.org/bots/api) retrieved on 2026-09-12. Verified `X-Telegram-Bot-Api-Secret-Token`, update and message identities, `reply_to_message`, callback data, `getFile` file_path download, provider 20 MB download cap, `sendMessage` confirmation fields and `reply_parameters`. Ground applies its stricter 10 MiB cap. Telegram has no Ground-supplied send idempotency key; uncertain delivery remains a reconciliation state. No account capability verified.

Existing configuration names used: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_DEMO_CHAT_ID and mapped member IDs through demo manifest. TEST_DATABASE_URL opts into the isolated database test and is never used as an active demo schema.
