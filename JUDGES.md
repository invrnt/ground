# Ground: evaluation guide

Ground helps construction teams turn jobsite reports into project updates and a reviewed next action. Workers report through Telegram; supervisors inspect evidence and approve quotation requests in the web workspace.

## Start here

The team has completed the hackathon submission, including the project title, written description, public GitHub repository, two-minute demonstration video and social media post tagging the event partners. Start with the video provided in the hackathon portal. The submitted demo uses Telegram for worker reports and request delivery, with the web workspace for supervisor review and approval.

| Artifact | Availability |
| --- | --- |
| Project title and written description | Submitted through the hackathon portal |
| Public GitHub repository | [invrnt/ground](https://github.com/invrnt/ground) |
| Two-minute Telegram demo | Submitted through the hackathon portal |
| Social media post tagging event partners | Completed as part of the submission |
| Local checks and implementation evidence | [Validation record](docs/release/validation.md) and [evidence index](docs/release/evidence/README.md) |
| Installation and configuration | [README](README.md#run-locally) and [runbook](docs/release/runbook.md) |

For an accompanied session, ask the team for the current demo URL and a provisioned account. Access details are shared privately. A tunnel to a team laptop is available only while that laptop, the app and the tunnel are running. No permanent public deployment is claimed.

## Follow one report through the system

The Telegram demo follows a labelled construction project, La Arboleda. Use this walkthrough to inspect the report, project changes and reviewed next action.

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
- **Vercel AI Gateway** is the team's selected configuration for transcription and multimodal extraction. OpenRouter remains a supported alternative.
- **Exa** retrieves supplier sources; Ground keeps source attribution and missing facts visible.
- **Ambiguous** receives the photo, assigned task and managed report updates. Native task due dates are date-only; Ground includes the exact time in the description.
- **CopilotKit / AG-UI** presents committed state, evidence and the persisted approval interaction.

## Additional behavior worth inspecting

The short support session covers invoice versus receipt, correction and recovery. A six-bag invoice for COP 228,000 leaves cement stock at four; confirmed physical receipt raises it to ten once. Correcting tile consumption from eight to seven adds one compensating box and changes the need to 19. An uncertain external send remains available for reconciliation rather than automatic resend.

The application enforces project and role access on the server. Models propose operations; server code validates permissions and calculates balances. X-Ray shows observable operations and results, not private model reasoning.

## Implementation evidence and reproduction

Docker images were built and the database, API and worker started locally. Migration, provisioning, seeding and health checks succeeded. Historical critical tests and later provider transport checks are linked in the evidence index with their own scope.

The submitted video is the demonstration reference. The repository's historical validation records describe the checks performed at each stage; their pending-artifact notes predate the completed submission. The sample baseline export is a local fixture and contains no live provider results.

To reproduce independently, follow the runbook and supply your own credentials and authorized demo identities. The repository contains no public passwords or provider keys. The [submission checklist](docs/release/submission.md) records the event requirements; this guide reflects the team's confirmed submission status.
