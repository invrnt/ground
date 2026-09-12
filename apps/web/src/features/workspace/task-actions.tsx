import { useState, type FormEvent } from "react";
import {
  operationProposalSchema,
  operationResultSchema,
  type ProjectSnapshot,
} from "@ground/contracts";
import { apiRequest } from "../../lib/api-client";
import { Button, Field, ErrorState } from "../../ui";
export function TaskActions({
  task,
  projectId,
  version,
  csrfToken,
}: {
  task: ProjectSnapshot["tasks"][number];
  projectId: string;
  version: number;
  csrfToken: string;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null),
    [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const status = form.get("status"),
      due = form.get("due");
    const fields: Record<string, string> = {};
    if (typeof status === "string" && status) fields.status = status;
    if (typeof due === "string" && due)
      fields.due_at = new Date(`${due}:00-05:00`).toISOString();
    if (Object.keys(fields).length === 0) {
      setError("Choose a status or a new due time.");
      return;
    }
    const proposal = operationProposalSchema.parse({
      type: "update_assignment",
      entity_ids: { assignment_id: task.id },
      fields,
      evidence_ids: [],
      expected_version: version,
    });
    setPending(true);
    setError(null);
    try {
      const result = await apiRequest(`/api/projects/${projectId}/operations`, {
        schema: operationResultSchema,
        method: "POST",
        body: proposal,
        csrfToken,
      });
      if (result.status === "applied" || result.status === "already_applied")
        setDone(true);
      else
        setError(
          `The update was ${result.status.replaceAll("_", " ")}. Review the latest project state.`,
        );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Task update failed.");
    } finally {
      setPending(false);
    }
  }
  return (
    <details>
      <summary>Update assignment</summary>
      <form
        className="workspace-action-form"
        onSubmit={(event) => void submit(event)}
      >
        <label>
          Status
          <select name="status" defaultValue="" disabled={pending}>
            <option value="">Keep current status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <Field
          label="New due date and time · Bogotá"
          name="due"
          type="datetime-local"
          disabled={pending}
        />
        <Button type="submit" loading={pending}>
          Save assignment
        </Button>
        {error && <ErrorState message={error} />}{" "}
        {done && <p role="status">Assignment update committed.</p>}
      </form>
    </details>
  );
}
