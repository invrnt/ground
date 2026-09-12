# Foundation probes

The SDK probe uses CopilotKit 1.71.1 React v2, AG-UI client/core/encoder 0.0.59, and a Fastify SSE endpoint. `RunAgentInputSchema` validates incoming protocol messages. `STATE_SNAPSHOT` updates `useAgent` state; `TOOL_CALL_START`, `TOOL_CALL_ARGS` and `TOOL_CALL_END` render `useHumanInTheLoop`. Calling its `respond` callback adds a tool result and runs the backend again. The backend persists confirmation before returning its next state snapshot.

The sample uses fixed demo IDs and private atomic file storage. Its loopback endpoint has no product authentication and must never be exposed or registered in production. Stage 3 must use authenticated runtime routing, project/run IDs, durable database checkpoints, expiry/version/hash checks and the canonical ApprovalService. The probe's only mutation is its sample checkpoint.

`pnpm exec tsx tools/probes/providers.ts` runs one public Exa search and one contents request when explicitly invoked with `EXA_API_KEY`. Default tests never call providers. Telegram, OpenRouter and Ambiguous probes remain pending configured credentials and account mappings; do not guess Ambiguous endpoints. The checked-in local Ambiguous port is not an external API specification.
