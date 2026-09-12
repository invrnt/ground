import type { DomainEvent } from "@ground/contracts";
import { Card, EvidenceLink, StatusBadge } from "../../ui";
import { formatTimestamp } from "../../lib/formatters";
export function activityStatus(type: string) {
  if (type.endsWith("failed")) return "failed";
  if (type.includes("clarification.required")) return "needs_review";
  if (type.includes("sync_pending")) return "pending";
  if (type.includes("synced")) return "synced";
  if (type === "input.received" || type === "research.started")
    return "processing";
  return "completed";
}
export function providerFor(type: string) {
  if (type.startsWith("interpretation.")) return "OpenAI";
  if (type.startsWith("research.")) return "Exa";
  if (type.startsWith("remote.")) return "Ambiguous";
  if (type.startsWith("approval.") || type.startsWith("proposal."))
    return "CopilotKit";
  return "Ground";
}
export function StateChangeCard({ event }: { event: DomainEvent }) {
  return (
    <Card title={event.payload.summary} provider={providerFor(event.type)}>
      <div className="workspace-event-meta">
        <StatusBadge status={activityStatus(event.type)} />
        <time dateTime={event.occurred_at}>
          {formatTimestamp(event.occurred_at)}
        </time>
      </div>
      {event.evidence_ids.map((id) => (
        <EvidenceLink
          key={id}
          projectId={event.project_id}
          evidenceId={id}
          type="Source"
        >
          View evidence
        </EvidenceLink>
      ))}
      {event.type === "input.received" && (
        <EvidenceLink
          projectId={event.project_id}
          evidenceId={event.payload.entity_id}
          type="Message"
        >
          View original message
        </EvidenceLink>
      )}
      <details>
        <summary>Operation details</summary>
        <dl className="workspace-details">
          <dt>Operation</dt>
          <dd>{event.operation_id}</dd>
          <dt>Event</dt>
          <dd>{event.type}</dd>
          <dt>Committed version</dt>
          <dd>{event.project_version}</dd>
          <dt>Changed fields</dt>
          <dd>
            {event.payload.changed_fields.join(", ") || "No field changes"}
          </dd>
        </dl>
      </details>
    </Card>
  );
}
