# Material sourcing

Owner: `sourcing`. Requirements: RF17, RF26.

Start Exa after a confirmed positive material need. Search with real brand/reference, size, finish and city. Do not include project address, worker names, private messages or other jobsite data. Use at most two queries per need version, retrieve at most five pages per query and show at most three candidates.

Persist query, response time, URL, retrieved content or relevant extract and field-level evidence. Candidate facts include merchant, product, reference, sale unit, explicit coverage, published price/currency and stated delivery, transport and tax terms. Unknown fields are null. Separate original facts from calculated values.

Classify `Exact match`, `Needs review` or `Incompatible` by reference and specification before comparing price. Prioritize same-product candidates that meet the requested date. A different finish or shade requires explicit supervisor review. An incompatible candidate cannot be approved as the required material.

Call the canonical domain calculation for each coverage. Twenty boxes applies to 1.26 m²/box. A different product coverage changes box count before approval. Convert a price per m² into price per box only if the source explicitly gives coverage. Show published unit price, calculated subtotal and any known transport/tax separately. Unknown charges prevent a claimed final total.

Assumption: when box coverage differs, normalize compatible usable and timely committed stock to area before subtraction, then round the remaining area up by the candidate's explicit box coverage. Do not subtract a box of one coverage as though it were a box of another. Only stock compatible with the selected specification can offset its need.

SupplierComparisonCard shows calculation, compatibility, domain, retrieval time, evidence excerpts, public source links, requested delivery and unresolved terms. The fixtures in [scenario.md](scenario.md) choose A, flag B's date and require review for C; real sources need not reproduce those prices or ranking.

Few results are usable. No priced result uses `Price to confirm`. No compatible reference prepares an RFQ for the required specification with unresolved fields. Exa failure preserves the need, displays error and offers retry. Cached results show `Retrieved at ...` and their origin; never present fixtures as live data.

Provide an immutable selected-candidate snapshot to procurement, or a specification-only draft when candidates are unavailable. Research and opening a public source do not authorize contact with that merchant.
