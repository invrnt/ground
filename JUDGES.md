# Ground: evaluation guide

Ground helps construction teams turn jobsite reports into project updates and a reviewed next action. Workers report through Telegram; supervisors inspect evidence and approve quotation requests in the web workspace.

## Start here

The preferred evaluation path is a two-minute recording of one complete interaction, followed by its source and result records. The recording and shareable live evidence are not attached yet. This guide describes what to inspect once those artifacts are available; it does not claim that the full live journey has passed.

| Artifact | Availability |
| --- | --- |
| Two-minute demo and uncut capture | Pending recording |
| Live project, task, photo and report links | Pending configured run and evaluator access |
| Received quotation request and redacted run export | Pending live run |
| Local checks and implementation evidence | [Validation record](docs/release/validation.md) and [evidence index](docs/release/evidence/README.md) |
| Installation and configuration | [README](README.md#run-locally) and [runbook](docs/release/runbook.md) |

For an accompanied session, ask the team for the current demo URL and a provisioned account. Access details are shared privately. A tunnel to a team laptop is available only while that laptop, the app and the tunnel are running. No permanent public deployment is claimed.

## Follow one report through the system

The scenario is a labelled demo project, La Arboleda. These are the expected observations, not a record of completed live acceptance.

| Step | Action | What to verify |
| --- | --- | --- |
| 1 | Open the project before the report | Bathroom 2 is 62% complete; tile stock is eight boxes. |
| 2 | Luis sends the Spanish voice note and a reply photo in Telegram | The original input, author and linked photo remain accessible. |
| 3 | Inspect the committed project changes | Progress becomes 81%, tile stock becomes zero, and a north-wall leak review is assigned to Juan. |
| 4 | Open the office links | The photo, assigned task and site report exist in Ambiguous. For the baseline scenario, the review is due 13 Sep 2026 at 09:00 Bogotá. |
| 5 | Inspect the material need and source | The hallway needs 20 boxes at 1.26 m² per box; Exa provides an attributable public source. Unpublished prices and delivery conditions stay unknown. |
| 6 | Review the quotation request in CopilotKit | Material, quantity, exact text and Demo recipient are visible. Reload preserves the pending decision; Change creates a new version. |
| 7 | Approve once and open the recipient conversation | One actual request arrives. Ground records the message and follow-up; the same Ambiguous report reflects the result. |

The source voice note is:

> Terminamos el enchape del baño dos y usamos las últimas ocho cajas de porcelanato gris. Hay una fuga en la pared norte. Juan debe revisarla mañana a las nueve.

Approval alone is not delivery. A quotation request is not a purchase, payment or physical receipt. A successful request leaves tile stock at zero.

## What each integration does

- **Telegram** receives reports and delivers approved requests to an authorized demo conversation.
- **Vercel AI Gateway** is the team's selected configuration for transcription and multimodal extraction. OpenRouter remains a supported alternative. Model access and live extraction still need verification for the selected account.
- **Exa** retrieves supplier sources; Ground keeps source attribution and missing facts visible.
- **Ambiguous** receives the photo, assigned task and managed report updates. Native task due dates are date-only; Ground includes the exact time in the description.
- **CopilotKit / AG-UI** presents committed state, evidence and the persisted approval interaction.

## Additional behavior worth inspecting

The short support session covers invoice versus receipt, correction and recovery. A six-bag invoice for COP 228,000 leaves cement stock at four; confirmed physical receipt raises it to ten once. Correcting tile consumption from eight to seven adds one compensating box and changes the need to 19. An uncertain external send remains available for reconciliation rather than automatic resend.

The application enforces project and role access on the server. Models propose operations; server code validates permissions and calculates balances. X-Ray shows observable operations and results, not private model reasoning.

## Current verification limits

Docker images were built and the database, API and worker started locally. Migration, provisioning, seeding and health checks succeeded. Historical critical tests and later provider transport checks are linked in the evidence index with their own scope.

Those checks do not substitute for the full live Telegram → model → Exa/Ambiguous → approval → received-message run. The recording, live export, account-specific Ambiguous read-back and end-to-end delivery remain pending. The sample baseline export contains no live provider results.

To reproduce independently, follow the runbook and supply your own credentials and authorized demo identities. The repository contains no public passwords or provider keys. Event submission requirements and remaining checks are tracked in the [submission checklist](docs/release/submission.md).
