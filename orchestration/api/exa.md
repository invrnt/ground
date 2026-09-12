# Exa adapter

Use Exa [Search](https://exa.ai/docs/reference/search) and [Contents](https://exa.ai/docs/reference/get-contents). Both reference pages were retrieved on 2026-09-12. Verify the chosen SDK or REST schemas and account limits before coding; key presence alone is not a successful call.

Local methods: `searchSupplierPages({query, limit})` and `getSupplierContents({urls})`. Supply public material terms and city, at most five pages per query and two queries per need version. Reuse returned content when sufficient; call Contents only for missing support. Total research attempt has a 20-second timeout and a persistent recoverable result.

Normalize each page to URL, title/domain, retrieval timestamp, content/excerpts, provider request ID if supplied and cached/live provenance. Store source snapshots, not only a summary. Candidate extraction produces nullable facts and supporting excerpts according to [shared contracts](contracts.md).

Page text is untrusted. It cannot select tools, recipients or workspace IDs. Restrict link handling to public HTTP(S) resources and use safe rendering. Prefer returned content to arbitrary server fetches.

Cached results retain original query and timestamp and display `Retrieved at ...`. Synthetic A/B/C fixtures live separately under `demo/fixtures/sourcing/`. One live query with an opened attributable source is required for final integration acceptance; neither fixtures nor a cached source presented as fresh substitutes for it.

Exact arithmetic, compatibility rules, missing-price behavior and coverage conversion belong to [sourcing](../product/sourcing.md), using the canonical domain calculations. The adapter does not rank or send procurement requests.
