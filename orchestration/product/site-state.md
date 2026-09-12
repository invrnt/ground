# Site state and corrections

Owner: `site-domain`. Requirements: RF07, RF09, RF12, RF13, RF14, RF23.

Completing bathroom tiling changes reported progress from 62% to 81%. Repeating the milestone leaves 81%. Finishing and inspection remain pending. Reported progress is derived from configured completed weights, not an LLM percentage or photographic estimate.

Inventory is an append-only movement ledger. Balance equals initial plus receipts, returns and adjustments minus consumption. Use supported unit conversions and exact decimal arithmetic. Consuming eight boxes from eight leaves zero; consuming nine waits for resolution and cannot make stock negative. Validate the expected version under a database lock. Concurrent commands must either commit a valid balance or return a recoverable conflict.

Create the leak issue for bathroom 2, north wall W2, linked to the original audio/photo and plan P-03 revision 3. Assign Juan a review due at the resolved absolute time. Track issue and assignment status independently. Wall closure stays blocked until the review resolves the relevant dependency. Changing the due date updates the local assignment and schedules a remote update; resolving the issue can unblock dependent work.

Calculate hallway need after confirmed consumption. Gross quantity includes 10% allowance and rounds up by actual box coverage. Net need subtracts only usable stock and committed inbound stock due in time. An RFQ is not committed stock. Link material and task risks to the affected planned activity. A new or changed positive need schedules Exa research; deduplicate by need version.

`Fueron siete, no ocho` identifies the original consumption, checks who may correct it, and appends a +1 box compensation. Do not edit or delete the original movement. Need becomes 19. An ambiguous correction asks which operation it refers to. Assumption: supervisors may correct any project report; a worker may correct their own report within the same active run.

Stock, candidate, quantity, date, recipient or price changes invalidate affected pending proposals through versioned events. For approved but unsent work, invalidate the dispatch authorization before a worker can claim it. If a send has already started or completed, preserve its record and prepare a separately approved amendment. Never rewrite history or automatically send a correction.

Every command returns the shared operation result and evidence links. Inventory receipt and purchase workflows call this module's inventory service; they do not maintain another stock balance.
