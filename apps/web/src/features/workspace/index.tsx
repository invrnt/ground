import { useAgent, useRenderToolCall } from "@copilotkit/react-core/v2";
import { idSchema, type Session, type LiveState } from "@ground/contracts";
import {
  WorkspaceProvider,
  InteractionCards,
  type WorkspaceSlots,
} from "../../copilot/workspace-provider";
import {
  WorkspaceShell,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "../../ui";
import { SignOutButton, ForbiddenState } from "../auth";
import {
  formatDate,
  formatQuantity,
  formatTimestamp,
} from "../../lib/formatters";
import { IssueCard } from "./issue-card";
import { TaskActions } from "./task-actions";
import { EvidenceView } from "../evidence";
import "./workspace.css";
export { StateChangeCard } from "./state-change-card";
export { IssueCard } from "./issue-card";
function ActivityCards() {
  const { agent } = useAgent({ agentId: "ground" });
  const render = useRenderToolCall();
  const cards = agent.messages.flatMap((message) =>
    message.role === "assistant"
      ? (message.toolCalls ?? [])
          .filter((call) =>
            ["show_state_change", "show_issue"].includes(call.function.name),
          )
          .map((call) => {
            const result = agent.messages.find(
              (item) => item.role === "tool" && item.toolCallId === call.id,
            );
            return (
              <div key={call.id}>
                {render({
                  toolCall: call,
                  ...(result?.role === "tool" ? { toolMessage: result } : {}),
                })}
              </div>
            );
          })
      : [],
  );
  return (
    <div className="workspace-activity-cards">
      {cards.length ? (
        cards.slice(-20).reverse()
      ) : (
        <EmptyState title="No committed activity yet">
          Incoming reports and their operations will appear here.
        </EmptyState>
      )}
    </div>
  );
}
export function LiveWorkspace({
  session,
  slots = {},
}: {
  session: Session;
  slots?: WorkspaceSlots;
}) {
  const requested =
    window.location.pathname.split("/")[2] ?? session.project_ids[0];
  const parsed = idSchema.safeParse(requested);
  if (!parsed.success || !session.project_ids.includes(parsed.data))
    return <ForbiddenState />;
  const projectId = parsed.data;
  return (
    <WorkspaceProvider
      projectId={projectId}
      csrfToken={session.csrf_token}
      slots={slots}
    >
      {(state, connected, error) =>
        state ? (
          <WorkspaceContent
            state={state}
            connected={connected}
            error={error}
            session={session}
            slots={slots}
          />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <LoadingState label="Loading committed project state…" />
        )
      }
    </WorkspaceProvider>
  );
}
function WorkspaceContent({
  state,
  connected,
  error,
  session,
  slots,
}: {
  state: LiveState;
  connected: boolean;
  error: string | null;
  session: Session;
  slots: WorkspaceSlots;
}) {
  const snapshot = state.snapshot;
  const evidenceMatch = window.location.pathname.match(/\/evidence\/([^/]+)$/);
  const evidence = evidenceMatch?.[1];
  return (
    <WorkspaceShell
      projectName={snapshot.project_name ?? "Project workspace"}
      runLabel={`Demo · ${formatDate(snapshot.scenario_date)} · Version ${snapshot.project_version}`}
      connection={connected ? "connected" : "disconnected"}
      account={<SignOutButton csrfToken={session.csrf_token} />}
      activity={
        <section>
          <h2>X-Ray</h2>
          <p className="g-metadata">
            Observable committed operations · latest 20
          </p>
          <ActivityCards />
        </section>
      }
    >
      {error && <ErrorState message={error} />}{" "}
      {evidence && (
        <>
          <a href={`/projects/${snapshot.project_id}`}>Back to workspace</a>
          <EvidenceView projectId={snapshot.project_id} evidenceId={evidence} />
        </>
      )}
      {!evidence && (
        <>
          <section className="workspace-summary">
            <Card title="Reported progress">
              <p className="workspace-metric g-number">
                {snapshot.reported_progress !== undefined
                  ? `${formatQuantity(snapshot.reported_progress)}%`
                  : "Not available"}
              </p>
              <p className="g-metadata">
                Reported completion, not technical certification.
              </p>
            </Card>
            <Card title="Material balances">
              {snapshot.stock.length ? (
                snapshot.stock.map((item) => (
                  <div className="workspace-stock" key={item.id}>
                    <span>
                      {String(
                        item.fields.name ?? item.fields.code ?? "Material",
                      )}
                    </span>
                    <strong className="g-number">
                      {typeof item.fields.quantity === "string"
                        ? formatQuantity(
                            item.fields.quantity,
                            String(item.fields.unit ?? ""),
                          )
                        : "Unknown"}
                    </strong>
                  </div>
                ))
              ) : (
                <p>No materials configured.</p>
              )}
            </Card>
          </section>
          <Card title="Work plan">
            {snapshot.work.map((item) => (
              <div className="workspace-work" key={item.id}>
                <strong>{String(item.fields.name ?? "Work item")}</strong>
                <span>{String(item.fields.status ?? "Unknown")}</span>
              </div>
            ))}
          </Card>
          <section className="workspace-issues">
            <h2>Issues</h2>
            {snapshot.issues.length ? (
              snapshot.issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  actions={{
                    projectId: snapshot.project_id,
                    version: snapshot.project_version,
                    csrfToken: session.csrf_token,
                  }}
                />
              ))
            ) : (
              <EmptyState title="No issues recorded">
                New reports will appear here after they commit.
              </EmptyState>
            )}
          </section>
          <Card title="Assigned work">
            {snapshot.tasks.length ? (
              snapshot.tasks.map((task) => (
                <article key={task.id} className="workspace-task">
                  <h3>
                    {String(
                      task.fields.description ??
                        task.fields.name ??
                        "Review assignment",
                    )}
                  </h3>
                  <p>
                    {String(task.fields.status ?? "Unknown")} ·{" "}
                    {snapshot.members.find(
                      (member) => member.id === task.fields.assignee_id,
                    )?.fields.display_name ?? "Unassigned"}
                  </p>
                  {typeof task.fields.due_at === "string" && (
                    <p>
                      Due{" "}
                      {formatTimestamp(task.fields.due_at, snapshot.timezone)}
                    </p>
                  )}
                  <p className="g-metadata">
                    Remote sync:{" "}
                    {snapshot.remote_links.find(
                      (link) => link.local_id === task.id,
                    )?.sync_status ?? "No visible remote link"}
                  </p>
                  <TaskActions
                    task={task}
                    projectId={snapshot.project_id}
                    version={snapshot.project_version}
                    csrfToken={session.csrf_token}
                  />
                </article>
              ))
            ) : (
              <p>No assignments recorded.</p>
            )}
          </Card>
          <Card title="Material needs">
            {snapshot.needs.length ? (
              snapshot.needs.map((need) => (
                <p key={need.id}>
                  {snapshot.stock.find((item) => item.id === need.material_id)
                    ?.fields.name ?? "Material"}
                  : <strong>{formatQuantity(need.net_quantity)}</strong> needed
                  by {formatDate(need.required_date)}
                </p>
              ))
            ) : (
              <p>No material needs recorded.</p>
            )}
          </Card>
          {slots.query} <InteractionCards />
          {state.checkpoints
            .filter((checkpoint) => checkpoint.status === "expired")
            .map((checkpoint) => (
              <Card
                key={checkpoint.id}
                title="Decision expired"
                provider="CopilotKit"
              >
                <StatusBadge status="needs_review" />
                <p>
                  Request a fresh review. No request has been sent by this
                  expired interaction.
                </p>
              </Card>
            ))}
          {snapshot.remote_links.length > 0 && (
            <Card title="Office links" provider="Ambiguous">
              {snapshot.remote_links.map((link) => (
                <p key={`${link.object_kind}-${link.local_id}`}>
                  <a
                    href={link.remote_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.object_kind}
                  </a>{" "}
                  · {link.sync_status} · Synced version {link.synced_version}
                </p>
              ))}
            </Card>
          )}
        </>
      )}
    </WorkspaceShell>
  );
}
