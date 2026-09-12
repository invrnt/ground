# Ground · Slack channel adapter

Self-contained adapter that connects a Slack workspace to the Ground core. It owns
layer 2 of the architecture (channel adapter) and the Slack half of layer 7 (outbound
messages, cards, supplier dispatch). It contains no domain logic: balances, progress,
approvals and jobs are the core's job.

```
Slack (Socket Mode)  ──events, files, button taps──▶  this adapter  ──InboundEnvelope / InteractionEnvelope──▶  core
Slack                ◀──chat.postMessage / chat.update──  this adapter  ◀──sendText / sendCard / resolveCard──  core
```

## Boundaries with the rest of the repo

- Everything lives under `channels/slack/`. Nothing outside this folder is touched.
- `src/contract.ts` is a *proposal* of the shared channel contract. When the core team
  publishes the canonical one, replace this file with an import and delete it.
- The core is reached through `CoreIngress` (two calls) and calls back through
  `ChannelEgress` (three calls). Transport today is HTTP (`src/core-http.ts`); if the
  core ends up in the same process, wire the interfaces directly and drop the HTTP file.

## Run it

```sh
cp .env.example .env      # fill the values, see "What you need" below
npm install
npm test                  # unit tests, no Slack needed
npm run dev               # connects to Slack via Socket Mode
```

With `CORE_URL` empty the adapter runs against a built-in fake core (`src/dev-core.ts`).
It prints every envelope it receives and answers each message with a two-button card.
Tapping a button resolves the card and, on "yes", sends a test request to the supplier
channel. That is the first-block test in the PRD (§09) executed for real.

## What the adapter guarantees

| PRD rule | Where |
|---|---|
| Only allowlisted conversations are read; only allowlisted conversations receive messages | `config.ts`, `slack-adapter.ts` guards |
| Identity comes from Slack's authenticated user id, never from message text | `mapping.ts`, interaction handler |
| Same delivery twice ⇒ same `dedupKey` (channel + bot + team + ts) | `mapping.ts`, `dedup.ts`; the DB unique key in the core is the real guarantee |
| Edited message ⇒ new input referencing the previous one | `mapping.ts` (`message_changed`) |
| Provider URLs and bot token never leave the adapter | `downloader()` streams bytes to the core |
| Attachment limits (10 MB, 60 s audio) rejected with a reason | `mapping.ts` |
| Cards are built from the typed contract; model output is never rendered as blocks | `blocks.ts` |
| At most two choices per card | `blocks.ts` throws otherwise |
| Rejected button taps are shown only to the tapping user | ephemeral `respond` |

Not handled here on purpose: action-token verification, role checks, version expiry,
retries of supplier sends, reconciliation of uncertain sends. Those are core rules.

## Slack specifics worth knowing

- Socket Mode means no public URL and no webhook signing in dev. For a deployed build
  you can flip to HTTP events; Bolt keeps the handlers.
- Slack has no native voice notes like Telegram. Audio arrives as a file (`audio/mp4`
  from the mobile recorder, `audio/webm` from desktop clips) with `duration_ms`.
- Files come with `url_private_download` and need the bot token as a bearer header,
  plus the `files:read` scope. Without the scope Slack answers HTML; the downloader
  detects that.
- A reply in a thread has `thread_ts`. Slack has no "reply to message" outside threads,
  so the 4 s grouping window in the core matters more here than on Telegram.
- Slack retries an event if not acked in 3 s. Bolt acks immediately; the core call runs
  after the ack, so the core must be idempotent on `dedupKey` (it is, per PRD).
