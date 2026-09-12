import { useState, type FormEvent } from "react";
import {
  operationProposalSchema,
  operationResultSchema,
  type ProjectSnapshot,
} from "@ground/contracts";
import {
  Card,
  StatusBadge,
  Button,
  Field,
  ErrorState,
  EvidenceLink,
} from "../../ui";
import { apiRequest } from "../../lib/api-client";
export function IssueCard({
  issue,
  actions,
}: {
  issue: ProjectSnapshot["issues"][number];
  actions?: { projectId: string; version: number; csrfToken: string };
}) {
  const fields = issue.fields;
  const status = String(fields.status ?? "Unknown");
  const evidence = Array.isArray(fields.evidence_ids)
    ? fields.evidence_ids
    : [];
  const [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null),
    [done, setDone] = useState(false);
  async function resolve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!actions || pending) return;
    const note = new FormData(event.currentTarget).get("note");
    const proposal = operationProposalSchema.parse({
      type: "resolve_issue",
      entity_ids: { issue_id: issue.id },
      fields: { resolution_note: note },
      evidence_ids: evidence,
      expected_version: actions.version,
    });
    setPending(true);
    setError(null);
    try {
      const result = await apiRequest(
        `/api/projects/${actions.projectId}/operations`,
        {
          schema: operationResultSchema,
          method: "POST",
          body: proposal,
          csrfToken: actions.csrfToken,
        },
      );
      if (["applied", "already_applied"].includes(result.status)) setDone(true);
      else
        setError(
          `Resolution was ${result.status.replaceAll("_", " ")}. Review the latest state.`,
        );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Resolution could not be saved.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Card title={String(fields.description ?? fields.name ?? "Issue")}>
      <StatusBadge
        status={
          status === "resolved"
            ? "completed"
            : status === "in_review"
              ? "needs_review"
              : "pending"
        }
      />
      <p>{String(fields.observed_condition ?? "No condition recorded.")}</p>
      <p className="g-metadata">
        Local status: {status} · Version {issue.version}
      </p>
      {typeof fields.drawing_reference === "string" && (
        <p>Drawing reference: {fields.drawing_reference}</p>
      )}
      {typeof fields.resolution_note === "string" && (
        <p>{fields.resolution_note}</p>
      )}
      {actions &&
        evidence.map((id) => (
          <EvidenceLink
            key={id}
            projectId={actions.projectId}
            evidenceId={id}
            type="Source"
          >
            View evidence
          </EvidenceLink>
        ))}
      {actions && status !== "resolved" && (
        <details>
          <summary>Resolve issue</summary>
          <form
            className="workspace-action-form"
            onSubmit={(event) => void resolve(event)}
          >
            <Field
              name="note"
              label="Resolution note"
              required
              disabled={pending}
            />
            <p className="g-metadata">
              Existing evidence stays linked to this resolution.
            </p>
            <Button type="submit" loading={pending}>
              Save resolution
            </Button>
            {error && <ErrorState message={error} />}{" "}
            {done && <p role="status">Resolution committed.</p>}
          </form>
        </details>
      )}
    </Card>
  );
}
