# Sourcing handoff

Stage 3 base `92a0f1f`. Shared Stage 4 checkpoints `272fc4a`, `2aa9d71` and `13433c1` provide sourcing/purchase/report contracts, schemas and report coalescing. Feature contribution is the commit containing this handoff. Peer composition and combined gate remain pending.

Implemented Exa Search/Contents REST adapter with a 20-second research deadline, bounded response bytes, two persisted queries per need version and five pages per query. Public queries use only configured material brand/reference/finish plus generic product/country terms. No worker message, address, name or project text enters the query. Source URLs must be public HTTP(S); Ground uses Exa content rather than arbitrary direct server fetches. Queries, request IDs/timing, source content/hash and retrieved time persist. Completed research reuses immutable candidates and sources. Failures preserve the need and expose status/error. Exhausting the two-query budget requires specification review rather than unbounded automatic queries.

Conservative labeled-field extraction retains unknown facts as null, with excerpts for reference, finish, coverage, price/unit/currency, delivery, transport and tax. It never infers COP from a dollar sign or silently fills a charge. Candidate compatibility compares known reference and finish; unknowns require review. There is no provider winner hardcoded in live code.

The Orchestrator granted `packages/domain/src/quantities.ts` solely for canonical alternate-coverage box calculation. It converts compatible stock to area before subtraction and rounding. Sourcing uses that helper and the existing exact money functions. A/B/C fixtures are isolated under demo/fixtures/sourcing. Known component sums are shown separately; unknown tax or transport leaves final total null.

SupplierComparisonCard has at most three rows, source/domain/retrieval evidence, explicit match/date states, expandable calculation and an RFQ specification-only state. SourcingPanel follows the existing SDK state to refetch changed need versions. No second project store or browser calculation is introduced. Server comparison reads require cost roles. Research does not contact suppliers.

Immutable `selection(context,needId,needVersion,candidateId|null)` records the chosen need/candidate/calculation or a specification-only selection. Incompatible candidates cannot be selected. Future procurement consumes this port and owns approval and sends.

## Integration exports

- `ExaClient(key)` implements frozen ExaAdapter and bounded `searchSupplierPages`/`getSupplierContents`; optional fetch injection is for controlled tests only.
- `SourcingService({transactions,projects,queue,adapter})`, `sourcingModule(service,sessions)` register research_need and canonical needs/read/research routes.
- `comparison(context,needId,tx?)`, `selection(...)`, and `sourcesForRun(context,tx)` expose scoped persisted state. Report source enrichment returns `{id,url,title}` under the supplied transaction.
- `SourcingPanel({projectId,csrfToken})` renders in `slots.supplierTools` inside the existing Copilot provider, only for cost-authorized roles at composition.
- Reporting owns the sole content-event scheduler. The shared queue's `enqueueLatest` coalesces pending report versions while retaining leased/uncertain payloads and newest desired successors. Successful writes schedule the successor; uncertain writes remain held. Per-dedupe advisory locks serialize concurrent insertion. New `report_event_cursors.last_report_id` separates report reads from report enqueue state.

## Checks

The required critical test started by failing on the missing calculation module. Final focused run with isolated TEST_DATABASE_URL passed three cases: A/B/C priority and known component sums, price-per-area and alternate coverage, unknown charges, real PostgreSQL source persistence/research dedupe and active/uncertain report coalescing. A persisted extraction assertion exposed the missing English Transport label; added the explicit label and reran only the affected file, which passed. Scoped server and web typechecks passed.

Manually inspected the three-row comparison and expanded calculation in Chrome using a clearly labeled synthetic preview. Text, date conflicts, source attribution and unknown total remained visible. No live prices were shown in the preview. Temporary preview source/main changes and Vite process were removed/stopped.

## Exa evidence and limits

Reused Stage 1's successful live Exa Search and Contents access evidence, per the no-repeat probe rule and Orchestrator confirmation. Its query was `porcelanato gris 60x60 Colombia`; returned source was https://porcelanite.com.co/producto/urban-grey-60x60/. Reopened that public source during this stage. It identifies ceramic material, grey colour, matte surface and SKU EURBAU716JI, without a published price on the inspected page. This is attributable access evidence, not a verified match for the required porcelain or a price quote. No extra paid probe ran and no token was read or printed in this stage. Real brand/reference/finish remains pending configuration; product matching acceptance is not fabricated.

Verified current official Exa Search/Contents documentation for numResults, text contents, request identifiers and response schemas. Reused existing REST dependencies and decimal.js 10.6.0. Added reporting-owner-requested @pdf-lib/fontkit 1.1.1. No new secret configuration names. FEEDBACK.md absent at start and before handoff; parent reported no PR feedback.
