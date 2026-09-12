import type { FastifyInstance, FastifyRequest } from "fastify";
import { EventEncoder } from "@ag-ui/encoder";
import { EventType, RunAgentInputSchema, type BaseEvent } from "@ag-ui/core";
import {
  GroundError,
  approvalDecisionInputSchema,
  idSchema,
  type ActorContext,
  type ApprovalCheckpoint,
  type ApprovalDecisionInput,
} from "@ground/contracts";
import { Sessions } from "../../infra/sessions";
import { LiveService } from "./live-service";
export * from "./live-service";
export interface DecisionTransport {
  arguments(
    context: ActorContext,
    checkpoint: ApprovalCheckpoint,
  ): Promise<Record<string, unknown>>;
  decide(
    context: ActorContext,
    checkpoint: ApprovalCheckpoint,
    input: ApprovalDecisionInput,
  ): Promise<unknown>;
}
export function liveModule(
  service: LiveService,
  sessions: Sessions,
  decisions?: DecisionTransport,
) {
  const encoder = new EventEncoder();
  return {
    name: "live",
    registerRoutes: async (app: FastifyInstance) => {
      app.get<{ Params: { p: string } }>(
        "/api/projects/:p/snapshot",
        async (request, reply) => {
          const context = await sessions.context(
            request,
            idSchema.parse(request.params.p),
          );
          reply.header("Cache-Control", "private, no-store");
          return (await service.state(context)).snapshot;
        },
      );
      app.get<{ Params: { p: string; id: string } }>(
        "/api/projects/:p/evidence/:id",
        async (request, reply) => {
          const context = await sessions.context(
            request,
            idSchema.parse(request.params.p),
          );
          reply.header("Cache-Control", "private, no-store");
          return service.evidence(context, idSchema.parse(request.params.id));
        },
      );
      app.get<{ Params: { p: string }; Querystring: { after?: string } }>(
        "/api/projects/:p/events",
        async (request, reply) => {
          const projectId = idSchema.parse(request.params.p);
          const after = Number(request.query.after ?? 0);
          if (!Number.isSafeInteger(after) || after < 0)
            throw new GroundError("VALIDATION_ERROR", "Invalid event cursor");
          const first = await service.state(
            await sessions.context(request, projectId),
          );
          reply.hijack();
          reply.raw.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "private, no-store",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          });
          const send = (state: typeof first) =>
            reply.raw.write(
              `id: ${state.snapshot.event_cursor}\n${encoder.encode({ type: EventType.STATE_SNAPSHOT, snapshot: state })}`,
            );
          // A full consistent snapshot also repairs a missing/retired cursor. Events are the latest bounded history.
          send(first);
          let active = true;
          let busy = false;
          const timer = setInterval(() => {
            if (!active || busy) return;
            busy = true;
            void (async () => {
              try {
                const state = await service.state(
                  await sessions.context(request, projectId),
                );
                if (!active) return;
                if (!send(state)) reply.raw.end();
              } catch {
                if (active) reply.raw.end();
              } finally {
                busy = false;
              }
            })();
          }, 3000);
          reply.raw.on("close", () => {
            active = false;
            clearInterval(timer);
          });
        },
      );
      async function run(request: FastifyRequest, projectId: string) {
        await sessions.mutation(request);
        const context = await sessions.context(request, projectId);
        const input = RunAgentInputSchema.parse(request.body);
        const expectedThread = `${context.project_id}:${context.run_id}`;
        if (input.threadId !== expectedThread)
          throw new GroundError(
            "CONFLICT",
            "The project run changed. Reload the workspace.",
          );
        // A frontend resume commits through the checkpoint bridge before resolving the SDK hook.
        // Automatic SDK continuation only reads the committed state; it never creates another decision.
        const knownToolCalls = new Set(
          input.messages.flatMap((message) =>
            message.role === "assistant"
              ? (message.toolCalls ?? []).map((call) => call.id)
              : [],
          ),
        );
        const state = await service.state(context);
        const events: BaseEvent[] = [
          {
            type: EventType.RUN_STARTED,
            threadId: input.threadId,
            runId: input.runId,
          },
          { type: EventType.STATE_SNAPSHOT, snapshot: state },
        ];
        // Completed observable cards use SDK tool rendering; no effect handler is replayed.
        const after =
          typeof input.forwardedProps === "object" &&
          input.forwardedProps !== null &&
          "after" in input.forwardedProps
            ? Number(input.forwardedProps.after)
            : 0;
        for (const event of state.events
          .filter(
            (event) =>
              event.sequence > after && !knownToolCalls.has(event.event_id),
          )
          .slice(-20))
          events.push(
            {
              type: EventType.TOOL_CALL_START,
              toolCallId: event.event_id,
              toolCallName:
                event.type === "issue.updated"
                  ? "show_issue"
                  : "show_state_change",
              parentMessageId: `event-${event.event_id}`,
            },
            {
              type: EventType.TOOL_CALL_ARGS,
              toolCallId: event.event_id,
              delta: JSON.stringify({ event }),
            },
            { type: EventType.TOOL_CALL_END, toolCallId: event.event_id },
            {
              type: EventType.TOOL_CALL_RESULT,
              toolCallId: event.event_id,
              messageId: `result-${event.event_id}`,
              content: JSON.stringify({ status: "committed" }),
            },
          );
        for (const checkpoint of state.checkpoints.filter(
          (checkpoint) =>
            checkpoint.status === "pending" &&
            !knownToolCalls.has(checkpoint.tool_call_id),
        )) {
          const args = {
            ...(decisions
              ? await decisions.arguments(context, checkpoint)
              : { unavailable: true }),
            checkpoint_id: checkpoint.id,
            tool_call_id: checkpoint.tool_call_id,
          };
          events.push(
            {
              type: EventType.TOOL_CALL_START,
              toolCallId: checkpoint.tool_call_id,
              toolCallName: "request_approval",
              parentMessageId: `decision-${checkpoint.id}`,
            },
            {
              type: EventType.TOOL_CALL_ARGS,
              toolCallId: checkpoint.tool_call_id,
              delta: JSON.stringify(args),
            },
            {
              type: EventType.TOOL_CALL_END,
              toolCallId: checkpoint.tool_call_id,
            },
          );
        }
        events.push({
          type: EventType.RUN_FINISHED,
          threadId: input.threadId,
          runId: input.runId,
        });
        return events.map((event) => encoder.encode(event)).join("");
      }
      app.post<{ Params: { p: string; id: string } }>(
        "/api/projects/:p/checkpoints/:id/resume",
        async (request, reply) => {
          await sessions.mutation(request);
          const context = await sessions.context(
            request,
            idSchema.parse(request.params.p),
          );
          const checkpoint = await service.checkpoint(
            context,
            request.params.id,
          );
          const input = approvalDecisionInputSchema.parse(request.body);
          if (
            input.proposal_id !== checkpoint.proposal_id ||
            input.proposal_version !== checkpoint.proposal_version
          )
            throw new GroundError("CONFLICT", "Decision version changed");
          if (checkpoint.status !== "pending")
            throw new GroundError(
              "CONFLICT",
              "This decision is already resolved. Reload the workspace.",
            );
          if (
            new Date(checkpoint.expires_at).getTime() <=
            new Date(context.trusted_time).getTime()
          )
            throw new GroundError(
              "EXPIRED",
              "Decision expired. Request a fresh review.",
            );
          if (!decisions)
            throw new GroundError(
              "NOT_READY",
              "Decision service is not registered",
            );
          const result = await decisions.decide(context, checkpoint, input);
          await service.transactions.pool.query(
            "UPDATE live_interactions SET status=$1 WHERE id=$2 AND project_id=$3 AND run_id=$4 AND status='pending'",
            [
              input.decision === "approve" ? "approved" : "rejected",
              checkpoint.id,
              context.project_id,
              context.run_id,
            ],
          );
          return reply
            .header("Cache-Control", "private, no-store")
            .send({ committed: true, result });
        },
      );
      app.post<{ Params: { p: string } }>(
        "/api/projects/:p/agent/run",
        async (request, reply) => {
          const body = await run(request, idSchema.parse(request.params.p));
          return reply
            .header("Cache-Control", "private, no-store")
            .type("text/event-stream")
            .send(body);
        },
      );
      // Same authenticated AG-UI bridge, exposed for a configured CopilotKit agent client.
      app.post("/api/copilotkit", async (request, reply) => {
        const input = RunAgentInputSchema.parse(request.body);
        const projectId = idSchema.parse(input.threadId.split(":")[0]);
        return reply
          .header("Cache-Control", "private, no-store")
          .type("text/event-stream")
          .send(await run(request, projectId));
      });
    },
  };
}
