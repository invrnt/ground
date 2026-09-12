# Invoices and receipts

Owner: `purchases`. Requirements: RF10, RF11.

Register a purchase from interpretation's validated invoice extraction. Save issuer/reference/date when present, line quantities, units, unit prices, exact totals, currency and original document evidence. For `F-DEMO-001`, extract six cement bags at 38,000 COP, total 228,000 COP.

Deduplicate first by scoped document hash, then normalized issuer and invoice reference when present. A same-reference mismatch needs review; do not quietly replace the recorded purchase. Missing or unreadable fields request concrete clarification through the existing interpretation service.

Recording the invoice leaves cement stock at four. Show a separate `Confirm receipt` action in Ground and an authenticated, role-checked Telegram continuation where used. Match the receipt to the purchase, persist its identity and call the single inventory service. Confirming the six-bag receipt once changes stock to ten. Repeated confirmations return the same receipt and stock.

Assumption: receiving staff are the supervisor or a project member explicitly permitted to confirm a receipt. Purchasing access alone does not imply authority to approve supplier requests. Any quantity discrepancy must be explicitly entered and validated; never mark an unseen delivery received.

Provide a compact invoice/receipt view with purchase status, receipt status, evidence, amount visible only to authorized roles and the resulting movement. Preserve the source operation and correction history. The invoice remains outside the main video but in the functional MVP.
