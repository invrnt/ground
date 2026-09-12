# Integration policy

All four sponsors are P0. Build priority is OpenAI and CopilotKit, then Exa and Ambiguous. Probe documentation and available access in Stage 1 before implementation branches depend on them. Repeat only failed or unavailable checks when credentials arrive.

| Boundary | Input | Output | Authority |
| --- | --- | --- | --- |
| Telegram | Authenticated update and private media | Persisted message; bounded reply/send result | Server membership and recipient allowlist |
| OpenAI | Original text, audio, image/PDF and scoped project context | Transcript, structured proposals, missing fields | No direct mutation or destination control |
| AG-UI/CopilotKit | Committed events and pending checkpoint | Reactive state, tool cards, human response | Backend validates and persists every decision |
| Exa | Public material specification, city and date need | Pages and source-backed candidates | No private project information in queries |
| Ambiguous | Typed file/task/report projection | Remote IDs, URLs and verified versions | Preconfigured workspace and mapped users |

Use one adapter per provider. Record provider call ID where available, local operation ID, run ID, latency, status, usage/cost if supplied, source IDs and remote object IDs. Do not log authorization headers, signed file URLs, full private media or unredacted unrelated messages.

Adapters return typed success, known failure or uncertain outcome. The durable job layer owns retry scheduling. Read retries and uncertain writes are different cases. No adapter automatically repeats a potentially completed external creation or send.

Account-specific Ambiguous schemas are an explicit configuration dependency. Keep a stable local adapter port while validating their actual implementation. Native Google Drive tools are not a replacement for demonstrating Ambiguous's Drive, Tasks and Docs.

See provider contracts in [api/](../api/contracts.md) and the [retrieval ledger](../execution/docs-retrieval.md). Existing app connectors are tools for the delivery team, not a runtime dependency for Ground's users.

## Runtime configuration names

Assumption: use these server-side names in `.env.example` and validate them at startup. Foundation owns that example; no agent should print or overwrite actual secret values.

| Names | Purpose |
| --- | --- |
| `DATABASE_URL`, `TEST_DATABASE_URL` | Main PostgreSQL and a separate test database; reject tests pointed at the active demo database |
| `PUBLIC_APP_URL`, `PORT`, `PRIVATE_STORAGE_PATH` | HTTPS origin, API port and private persistent storage |
| `SESSION_SECRET` | Server session protection; provision user password hashes through the setup command |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` | Bot access and authenticated webhook binding |
| `OPENAI_API_KEY`, `OPENAI_TRANSCRIPTION_MODEL`, `OPENAI_INTERPRETATION_MODEL` | Separate model configuration and server API access |
| `EXA_API_KEY` | Public supplier research |
| `AMBIGUOUS_API_BASE_URL`, `AMBIGUOUS_API_TOKEN` | Verified account API host and Bearer credential |
| `DEMO_MANIFEST_PATH`, `GROUND_MODE` | Scenario configuration; explicit demo versus normal clock behavior |

Keep nonsecret chat/user/workspace IDs and scenario facts in the validated manifest. Add a CopilotKit vendor key only if the selected runtime requires one; do not assume a hosted service or put a server key in a `VITE_` variable. Seed passwords are entered through a protected setup mechanism and stored only as hashes.
