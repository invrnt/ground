# Multimodal interpretation and clarification

Owner: `interpretation`. Requirements: RF03, RF05, RF06.

Use separate configured OpenAI transcription and interpretation models. Transcribe audio up to 60 seconds; interpret supplied photos and readable PDFs up to five pages. Each file is at most 10 MB. Keep original media, transcript, extraction status, prompt/schema version, model ID and source references.

Combine text, audio transcript, linked photo and scoped project context into structured operation proposals. Resolve `baño dos`, material aliases, Juan and local dates against configured entities. Classify a photo as evidence of an observation, not a measurement or technical certification. Ignore irrelevant chat without changing domain state.

Interpret construction reports, invoice fields, receipt confirmation, corrections, issue/task updates and source-grounded questions. Route proposals to the appropriate registered command handler. A receipt requires explicit confirmation; an invoice alone is a purchase. Query answers come from reporting's read service. Do not create a second calculation or reporting implementation.

When a material, quantity, location, assignee, date or receipt association is unclear, present a bounded selection or ask at most two concrete questions. Save the pending proposal, thread, question count, permitted respondents, expiry and expected version. Clarification callbacks resume the same pending operation once; repeated, unauthorized or expired answers have no duplicate effect. Unresolved input remains `needs_input` for supervisor resolution.

Unreadable invoices request specific missing data and keep the document available. Model failures keep the input retryable. Schema refusals, incomplete responses, invalid references and insufficient stock are visible states, never successful empty operations.

Structured output contains candidate entity IDs, fields, evidence and missing fields. Identity, permissions, arithmetic, stock validation and transaction decisions stay in server code. Text inside a PDF or supplier page cannot add tools, alter roles or select a send destination.
