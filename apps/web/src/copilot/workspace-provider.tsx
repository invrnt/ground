import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type ComponentType,
} from "react";
import { HttpAgent } from "@ag-ui/client";
import {
  CopilotKitProvider,
  useAgent,
  useCopilotKit,
  useHumanInTheLoop,
  useRenderTool,
  useRenderToolCall,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import {
  eventSchema,
  liveStateSchema,
  type ApprovalDecisionInput,
  type LiveState,
} from "@ground/contracts";
import { apiRequest } from "../lib/api-client";
import { Card, LoadingState } from "../ui";
import { StateChangeCard } from "../features/workspace/state-change-card";
import { IssueCard } from "../features/workspace/issue-card";
export interface DecisionRendererProps {
  args: Record<string, unknown>;
  status: string;
  respond?: (input: ApprovalDecisionInput) => Promise<void>;
}
export interface WorkspaceSlots {
  decision?: ComponentType<DecisionRendererProps>;
  query?: ReactNode;
  supplierTools?: ReactNode;
}
export function WorkspaceProvider({
  projectId,
  csrfToken,
  children,
  slots = {},
}: {
  projectId: string;
  csrfToken: string;
  children: (
    state: LiveState | null,
    connected: boolean,
    error: string | null,
  ) => ReactNode;
  slots?: WorkspaceSlots;
}) {
  const agent = useMemo(
    () =>
      new HttpAgent({
        agentId: "ground",
        url: `/api/projects/${projectId}/agent/run`,
        threadId: projectId,
        fetch: (url, init) =>
          fetch(url, {
            ...init,
            credentials: "same-origin",
            headers: {
              ...Object.fromEntries(new Headers(init.headers).entries()),
              "X-CSRF-Token": csrfToken,
              "Idempotency-Key": crypto.randomUUID(),
            },
          }),
      }),
    [projectId, csrfToken],
  );
  return (
    <CopilotKitProvider selfManagedAgents={{ ground: agent }} agentId="ground">
      <StateConnection
        projectId={projectId}
        csrfToken={csrfToken}
        slots={slots}
      >
        {children}
      </StateConnection>
    </CopilotKitProvider>
  );
}
function StateConnection({
  projectId,
  csrfToken,
  children,
  slots,
}: {
  projectId: string;
  csrfToken: string;
  children: (
    state: LiveState | null,
    connected: boolean,
    error: string | null,
  ) => ReactNode;
  slots: WorkspaceSlots;
}) {
  const { agent } = useAgent({ agentId: "ground" });
  const { copilotkit } = useCopilotKit();
  const [connected, setConnected] = useState(false),
    [error, setError] = useState<string | null>(null);
  const lastRendered = useRef(0);
  const parsed = liveStateSchema.safeParse(agent.state);
  const state = parsed.success ? parsed.data : null;
  useEffect(() => {
    let active = true;
    let currentRun = "";
    let renderedFingerprint = "";
    const source = new EventSource(
      `/api/projects/${projectId}/events?after=0`,
      { withCredentials: true },
    );
    source.onmessage = (event) => {
      try {
        const envelope = z
          .object({
            type: z.literal("STATE_SNAPSHOT"),
            snapshot: liveStateSchema,
          })
          .parse(JSON.parse(event.data));
        const next = envelope.snapshot;
        if (currentRun && currentRun !== next.snapshot.run_id) {
          agent.abortRun();
          agent.setMessages([]);
          lastRendered.current = 0;
        }
        currentRun = next.snapshot.run_id;
        agent.threadId = `${projectId}:${currentRun}`;
        agent.setState(next);
        setConnected(true);
        setError(null);
        const fingerprint = JSON.stringify([
          next.snapshot.run_id,
          next.snapshot.event_cursor,
          next.checkpoints,
        ]);
        if (!agent.isRunning && fingerprint !== renderedFingerprint) {
          renderedFingerprint = fingerprint;
          void copilotkit
            .runAgent({
              agent,
              forwardedProps: { after: lastRendered.current },
            })
            .then(() => {
              lastRendered.current = next.snapshot.event_cursor;
            })
            .catch((cause: unknown) => {
              renderedFingerprint = "";
              if (active)
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "The workspace interaction failed. Reload to recover.",
                );
            });
        }
      } catch {
        setError("Ground returned an invalid live update. Reload to recover.");
        setConnected(false);
      }
    };
    source.onerror = () => {
      if (active) {
        setConnected(false);
        setError(
          "Live updates are disconnected. Your last committed state is preserved.",
        );
      }
    };
    return () => {
      active = false;
      source.close();
      agent.abortRun();
    };
  }, [agent, copilotkit, projectId]);
  useRenderTool({
    name: "show_state_change",
    parameters: z.object({ event: eventSchema }),
    render: (props) =>
      props.status === "inProgress" ? (
        <LoadingState label="Loading committed change…" />
      ) : (
        <StateChangeCard event={props.parameters.event} />
      ),
  });
  useRenderTool(
    {
      name: "show_issue",
      parameters: z.object({ event: eventSchema }),
      render: (props) => {
        if (props.status === "inProgress")
          return <LoadingState label="Loading issue…" />;
        const issue = state?.snapshot.issues.find(
          (item) => item.id === props.parameters.event.payload.entity_id,
        );
        return issue ? (
          <IssueCard issue={issue} />
        ) : (
          <StateChangeCard event={props.parameters.event} />
        );
      },
    },
    [state],
  );
  const Decision = slots.decision;
  useHumanInTheLoop(
    {
      name: "request_approval",
      description: "Review the exact persisted procurement proposal",
      parameters: z.record(z.unknown()),
      render: ({ args, status, respond }) =>
        Decision ? (
          <Decision
            args={args}
            status={status}
            {...(respond
              ? {
                  respond: async (input: ApprovalDecisionInput) => {
                    try {
                      const toolCallId = z.string().parse(args.tool_call_id);
                      await apiRequest(
                        `/api/projects/${projectId}/checkpoints/${encodeURIComponent(toolCallId)}/resume`,
                        {
                          schema: z.object({
                            committed: z.literal(true),
                            result: z.unknown(),
                          }),
                          method: "POST",
                          body: input,
                          csrfToken,
                          idempotencyKey: toolCallId,
                        },
                      );
                      respond(input);
                    } catch (cause) {
                      setError(
                        cause instanceof Error
                          ? cause.message
                          : "Decision could not be confirmed.",
                      );
                      throw cause;
                    }
                  },
                }
              : {})}
          />
        ) : (
          <Card title="Decision awaiting review" provider="CopilotKit">
            <p>
              The decision module is not registered yet. No request has been
              sent.
            </p>
          </Card>
        ),
    },
    [Decision, projectId, csrfToken],
  );
  return (
    <>
      {slots.supplierTools}
      {children(state, connected, error)}
    </>
  );
}
export function InteractionCards() {
  const { agent } = useAgent({ agentId: "ground" });
  const current = liveStateSchema.safeParse(agent.state);
  const pendingIds = new Set(
    current.success
      ? current.data.checkpoints
          .filter((checkpoint) => checkpoint.status === "pending")
          .map((checkpoint) => checkpoint.tool_call_id)
      : [],
  );
  const render = useRenderToolCall();
  return (
    <div className="workspace-interactions">
      {agent.messages.flatMap((message) =>
        message.role === "assistant"
          ? (message.toolCalls ?? [])
              .filter(
                (call) =>
                  call.function.name === "request_approval" &&
                  pendingIds.has(call.id),
              )
              .map((call) => {
                const result = agent.messages.find(
                  (item) => item.role === "tool" && item.toolCallId === call.id,
                );
                return (
                  <div key={call.id}>
                    {render({
                      toolCall: call,
                      ...(result?.role === "tool"
                        ? { toolMessage: result }
                        : {}),
                    })}
                  </div>
                );
              })
          : [],
      )}
    </div>
  );
}
