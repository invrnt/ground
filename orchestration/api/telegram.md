# Telegram adapter

Use the official [Bot API](https://core.telegram.org/bots/api). Verify webhook secret validation, `update_id`, reply relationships, callback queries, file download limits and `sendMessage` for the chosen deployment. Documentation was retrieved on 2026-09-12; credentials and bot access were not tested here.

Local adapter methods are `verifyWebhook`, `normalizeUpdate`, `downloadFile`, `sendMessage` and `answerCallback`. They accept typed IDs and allowed media descriptors; only server configuration supplies the token. Runtime send callers are intake and dispatch; neither creates another Telegram client.

Unique inbox update key is bot identity plus provider update ID. Unique logical message key is bot/chat/message ID. Each normalized update retains actual sender, reply target and media IDs. Check group/project membership and callback responder permission before executing any proposal.

`sendMessage` returns provider message ID, chat ID and provider timestamp on confirmed success. Normalize a timeout after dispatch as possibly applied. Telegram send responses do not establish an idempotent request key supplied by Ground; include Ground's request ID in approved RFQ text for audit and human reconciliation. Never promise automatic lookup if the API cannot perform it.

The demo recipient must have an authorized reachable conversation. Researching a real merchant never authorizes a send to it. Source web pages and demo recipient labels remain separate. Incoming replies are forwarded to the dispatch service with original chat/message/reply IDs and evidence.

Webhook acknowledgement means persisted acceptance, not completed model work. All operational replies use the outbox and redact restricted details for a worker group.
