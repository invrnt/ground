# Documentation retrieval

Only retrieve docs needed for the assigned work and installed version. Prefer official sources and record exact methods/imports that were verified. Links below were opened during contract preparation on 2026-09-12 unless marked as a future lookup. This is documentation evidence, not proof of account access.

| ID | Source | Verify before coding |
| --- | --- | --- |
| D01 | [Node releases](https://nodejs.org/en/about/previous-releases), [pnpm workspaces](https://pnpm.io/workspaces), [Vite](https://vite.dev/guide/), [Fastify](https://fastify.dev/docs/latest/) | Pin Node 24 patch and compatible package versions; package exports, serving/proxy and session support |
| D02 | [node-postgres transactions](https://node-postgres.com/features/transactions), [PostgreSQL locks](https://www.postgresql.org/docs/current/explicit-locking.html) | One checked-out client per transaction; lock and queue claim semantics |
| D03 | [Telegram Bot API](https://core.telegram.org/bots/api) | Webhook secrets, replies/callbacks, media access, send outcome and recipient reachability |
| D04 | [OpenAI transcription](https://developers.openai.com/api/docs/guides/speech-to-text), [vision](https://developers.openai.com/api/docs/guides/images-vision), [structured output](https://developers.openai.com/api/docs/guides/structured-outputs), [file inputs](https://developers.openai.com/api/docs/guides/file-inputs) | Separate supported models, formats, schema validation, refusals and usage reporting |
| D05 | [CopilotKit AG-UI](https://docs.copilotkit.ai/ag-ui/introduction), [useAgent](https://docs.copilotkit.ai/reference/hooks/useAgent), [useHumanInTheLoop](https://docs.copilotkit.ai/reference/hooks/useHumanInTheLoop), [AG-UI events](https://docs.ag-ui.com/concepts/events) | Exact matched SDK/runtime versions, server adapter, tool response and durable reload integration |
| D06 | [Exa Search](https://exa.ai/docs/reference/search), [Contents](https://exa.ai/docs/reference/get-contents) | Current request body, content result, limits and attribution fields |
| D07 | [Ambiguous account API](https://www.ambiguous.ai/agents/api) | Retrieval failed here. Obtain actual account schema, workspace/users, upload/task/docs methods, safe updates and reconciliation |
| D08 | [React reference](https://react.dev/reference/react), [MDN web docs](https://developer.mozilla.org/en-US/docs/Web), [pdf-lib](https://pdf-lib.js.org/), [Vitest](https://vitest.dev/guide/) | Future lookup only as needed for pinned implementation; PDF text wrapping and fonts, form/focus behavior, small test setup |
| D09 | [GitHub PR command](https://cli.github.com/manual/gh_pr_view), [review comments API](https://docs.github.com/en/rest/pulls/comments) | Future lookup if CLI/connector behavior is unclear during Orchestrator's final review |

Do not guess a current model, dependency version, price or Ambiguous endpoint. Foundation records chosen versions, date and a short verified signature in its handoff. Read relevant existing findings before fetching the same docs again.

## Early access checklist

Record each as verified, failed or unavailable with a reason. Run available probes once, under the team's authorized demo setup:

- Telegram group membership/webhook and a reachable demo conversation.
- OpenAI transcription plus structured image/document-capable model availability.
- CopilotKit server event, rendered tool and response reaching a backend handler, including stored sample checkpoint recovery.
- One Exa search and content retrieval without private terms.
- Ambiguous mapped Juan, original file upload, assigned task with due date, document create/update and read-back, plus identity/reconciliation capability.

Provider secrets stay in the invoked server process. Foundation does not create an RFQ send probe without a reviewed recipient/payload authorization. When a later agent replaces a probe, preserve its useful IDs and evidence and remove dead probe registration through the shared owner.
