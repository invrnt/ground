# Telegram intake

Owner: `telegram-intake`. Requirements: RF02, RF04. RF03 extraction belongs to interpretation.

Accept text, voice/audio, photo and PDF updates from the configured group and authorized members. Authenticate the webhook and persist the unique update before responding. Repeated provider updates return the existing logical input. Persist the Telegram message ID, chat ID, sender, provider timestamp, receipt time, reply target, media identifiers and run ID.

Use `reply_to_message_id` as the primary report/attachment link. A late photo adds evidence to the existing report and schedules attachment synchronization without reapplying its operations. Two people reporting at once retain their own authors and threads. Never attach a photo to whichever voice note arrived last. An attachment without an unambiguous reply or report link waits for clarification.

Download allowed media through the sole Telegram adapter into private storage. Enforce intake limits before interpretation. Retain allowed originals and readable error states. Preserve the original content hash and actual photo author, even when linked to another member's audio. Do not require a public Telegram URL for private evidence; the authenticated evidence view can display source metadata.

Immediately send a compact Spanish receipt after durable acceptance. After committed results, send a Spanish summary such as:

> Baño 2: enchape registrado, avance 81%. Porcelanato: 0 cajas. Juan tiene la revisión de la fuga mañana a las 09:00. Estoy buscando las 20 cajas que necesita el pasillo.

The wording reflects actual state. Never claim search, sync or assignment success before it happens. Include a Ground link when useful; the user must authenticate. Costs, addresses and approval details must not be sent into the worker group.

The adapter delivers clarification prompts and callback answers prepared by interpretation, and routes authorized recipient replies to dispatch. Those modules own their semantics. Intake never approves a purchase or infers receipt from a supplier reply.
