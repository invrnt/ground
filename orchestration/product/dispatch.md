# Request dispatch and follow-up

Owner: `dispatch`. Requirements: RF19, RF20.

Consume the approved-request outbox item. Under a transaction, verify active run, unsent request, current authorized payload and immutable approval binding, then claim the send. Send exactly that text to that configured Telegram recipient through the existing adapter. Keep request ID in the message and store Telegram's message ID on success.

Show `Awaiting approval`, `Sending`, `Sent`, retryable failure or `send_uncertain`. Do not claim universal exactly-once delivery. If the provider may have accepted the message but no response is available, prohibit automatic resend and reconcile. Telegram may not offer a lookup that proves the outcome; an operator can inspect the demo conversation and record the result. A resend requires an explicit reviewed action once the outcome is established.

Match replies by authorized conversation plus reply-to sent message ID or explicit Ground request ID. Keep human replies as evidence and update request status. A supplier answer does not automatically change price approval, create a purchase or receive stock. An ambiguous reply needs a link selection.

After a confirmed send, save a follow-up job with due time, recipient, condition, request/task ID and run ID. Assumption: the demo reminder is due in two minutes and goes to Ana, never directly to a real supplier. At execution, recheck active run and whether the task/request still needs attention. Cancel it if the task is resolved, response removes the need, request is cancelled or run is reset. Persist jobs across restart.

The request detail view shows exact sent text, authorized recipient, provider message ID, timing, replies, follow-up due time and reconciliation state. A send and its result trigger a new report version and synchronization of the same Ambiguous document.
