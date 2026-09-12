# Hackathon submission checklist

Ground is being built for Agents, Everywhere, September 12–13, 2026. The [starter kit](https://github.com/CopilotKit/agents-everywhere-starter-kit) is optional; any technical stack is allowed. Keep the existing architecture. This checklist covers submission readiness; the PRD remains the product contract, subject to explicit user changes.

Sources checked September 12, 2026: [event rules summary](https://github.com/CopilotKit/agents-everywhere-starter-kit/blob/main/hackathon-rules.md) and [submission guidance](https://github.com/CopilotKit/agents-everywhere-starter-kit/blob/main/SUBMISSION.md). The summary is based on the San Francisco handbook. The team's local organizer's current rules take precedence.

## Checklist

Leave items unchecked until supporting evidence is recorded here or linked from the release documents.

- [ ] Identify the city's participant portal through the [global event page](https://aitinkerers.org/hackathons/global/agents-everywhere); record its URL, deadline/timezone and current handbook requirements.
- [ ] Verify the project and its core functionality were created during the official event period. A pre-existing project cannot be extended and entered as new. Identify inherited libraries, prompts and any reused code separately from event work.
- [ ] Prepare the project title and description: who uses Ground, what it does, and why existing jobsite conversation and project context matter.
- [ ] Provide a public GitHub repository with working code and clean-clone instructions, required credentials and processes. Exclude secrets and private data.
- [ ] Record a demonstration of at most two minutes showing one complete live interaction: Telegram audio/photo, project update, Exa research, Ambiguous record, CopilotKit approval and actual request delivery. Show the resulting record after refresh; approval alone is not execution.
- [ ] Label demo data, test recipients and unverified integrations. Link actual live evidence in [validation.md](validation.md); local tests do not prove live delivery. Reuse the single shared rehearsal under the [testing strategy](../../orchestration/testing/strategy.md).
- [ ] Explain evidence for all four judging criteria: Core Requirements & Functionality; Innovation & Theme Alignment; Technical Execution & Integration; Usefulness & Agentic Experience. Show context, a useful result, user control and a relevant failure/cancellation or recovery path.
- [ ] Prepare a public social post with the repository/video links and organizer-required partner tags. Credit technologies actually used; sponsor count is not a judging criterion.
- [ ] Confirm local upload fields and access requirements, then publish the post and submit by the verified deadline only with the user's authorization.

## Product description

Ground turns jobsite voice notes and photos into operational updates. Models accessed through Vercel AI Gateway interpret the report, Exa researches materials, and Ambiguous keeps the task, evidence and site report together. Supervisors use CopilotKit to inspect the changes and approve the next action. Workers stay in Telegram. Vercel is the team's selected demo configuration; OpenRouter is also supported. Live model results remain pending verification.

The public [evaluation guide](../../JUDGES.md) explains the intended walkthrough and current evidence availability. Add the actual recording and authorized evidence links before submission; no placeholder is a completed demo artifact.

## Technical description

Ground is a React/TypeScript workspace with a Fastify API and a PostgreSQL-backed worker. It retains private source media, commits domain state/events/jobs transactionally, and makes external writes through bounded provider adapters. Exact decimal arithmetic owns stock and procurement quantities. A supervisor approves the immutable request text and recipient through CopilotKit before the Telegram sender claims it. An uncertain external outcome stays in review rather than being automatically repeated.

The repository includes migrations, configured account provisioning, scenario seed/reset, scoped reports/PDF, durable retries, admin export and seven focused critical test files. The release gate passed all 13 checks with real isolated PostgreSQL. That is local implementation evidence; the complete live provider chain and recording are pending configuration.

## Event verification

The published rules summary requires a title, written description, public repository, two-minute demo and public social post. The team's city portal and handbook remain unverified, including the local deadline, eligibility, sponsor-prize conditions, licenses, evaluator access requirements and upload fields. Do not claim final eligibility until that portal is checked.

Before submission, record the official URL and check date, applicable categories, prior-code policy, duration/file limits, required fields, project-code license requirements and access instructions. The bundled report font includes its SIL Open Font License. No project-wide open-source license was selected on the user's behalf.

Missing final submission artifacts are the actual edited video, uncut capture, supporting evidence as needed, live run export, and authorized evaluator links. The provided subtitle and shot-list files are templates only.
