# Decisions and assumptions

## Observed repository

Inspection on 2026-09-12 found tracked `PRD.md` and `.gitignore`, with no application source, package manifest, lockfile or deployment setup. Base commit was `3cbca75`. A root `.env` contains an `EXA_API_KEY` variable name. Its value and validity were not inspected. No provider access was tested during contract authoring.

## Build decisions

| Topic | Decision |
| --- | --- |
| Product | Preserve PRD v2.0 RF01 through RF28 and all four P0 integrations |
| Language | React and TypeScript frontend; modular TypeScript backend, as specified |
| Workspace | Assumption: pnpm workspaces, Vite React, Fastify, Node.js 24 LTS, strict TypeScript |
| Persistence | PostgreSQL, `pg`, explicit SQL migrations and transactions; no ORM required |
| Processes | One API serving the built web app and one worker, sharing one server package |
| Queue | PostgreSQL inbox, outbox and scheduled jobs; no extra queue service |
| Files | Assumption: private persistent volume shared by API and worker on one host; storage behind one adapter for later object storage |
| Deployment | Assumption: Docker Compose on an available HTTPS host with persistent volumes; select the team's existing host during Stage 1 |
| Authentication | Assumption: provisioned demo accounts with hashed passwords, server sessions and explicit Telegram user-ID mappings; no public signup |
| UI | Assumption: one desktop-first workspace with accessible responsive fallback and CSS variables; no component library beyond what integration needs |
| Tests | Vitest for a small invariant set; manual live browser journey; no required browser automation framework |
| PDF | Assumption: server-generated PDF from the same report DTO using `pdf-lib`; do not introduce a browser renderer solely for PDF |

Node's official [release table](https://nodejs.org/en/about/previous-releases) identifies v24 as LTS. Stage 1 chooses exact compatible package patches and records them in the lockfile and handoff. A version number not recorded there is not pinned.

## Small unresolved choices

- Assumption: scenario date `2026-09-12`, required date `2026-09-13`, project timezone `America/Bogota`. Actual recording may use a revised manifest; relative dates resolve from that manifest during demo mode.
- Assumption: web users are admin, supervisor, purchasing, worker or task assignee. Ana is supervisor, Luis worker, Juan assignee. Admin provisioning is a separate operator capability.
- Assumption: reminders go to Ana, in Spanish, two minutes after the configured demo trigger if the task or request still needs attention. Any recipient-facing follow-up message needs its own approval.
- Assumption: approval and clarification tokens expire after 30 minutes; reload within that window restores the same pending decision. Expiry creates a visible renewal path without sending.
- Real material brand, commercial reference, finish, source URL, demo address, authorized chat IDs, workspace ID and Juan's remote ID must be configured, never invented. The lack of these values blocks a live rehearsal, not writing modules against contracts.
- Ambiguous's supplied API page could not be retrieved. Account-specific methods, bodies, assignments and update behavior remain unverified. See [Ambiguous contract](../api/ambiguous.md).
- Event award rules and credentials are not supplied. Delivery verifies the actual event portal when available; do not guess categories or claim eligibility.

## Testing override

The user requested hackathon speed. Preserve the original acceptance inventory, but replace thirty separate required tests, twenty-sample benchmarks, 20 extra model inputs and three mandatory rehearsals with the minimum gates in [testing strategy](../testing/strategy.md). Report omitted measurements and unchecked cases. This is a testing reduction, not permission to remove invoices, corrections, recovery or a sponsor integration.
