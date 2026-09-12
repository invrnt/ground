import { useEffect, useState } from "react";
import { evidenceDetailSchema, type EvidenceDetail } from "@ground/contracts";
import { apiRequest } from "../../lib/api-client";
import { Card, ErrorState, LoadingState } from "../../ui";
import { formatTimestamp } from "../../lib/formatters";
export function EvidenceView({
  projectId,
  evidenceId,
}: {
  projectId: string;
  evidenceId: string;
}) {
  const [evidence, setEvidence] = useState<EvidenceDetail | null>(null),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setEvidence(null);
    setError(null);
    void apiRequest(`/api/projects/${projectId}/evidence/${evidenceId}`, {
      schema: evidenceDetailSchema,
      signal: controller.signal,
    })
      .then(setEvidence)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Evidence could not be loaded.",
          );
      });
    return () => controller.abort();
  }, [projectId, evidenceId]);
  if (error) return <ErrorState message={error} />;
  if (!evidence) return <LoadingState label="Loading protected evidence…" />;
  return (
    <Card title="Original evidence">
      <p>
        <strong>{evidence.author}</strong> ·{" "}
        <time dateTime={evidence.received_at}>
          {formatTimestamp(evidence.received_at)}
        </time>
      </p>
      <h3>Source message</h3>
      <p className="workspace-source-text">
        {evidence.source_text ?? "No text accompanied this message."}
      </p>
      <h3>Transcript</h3>
      <p className="workspace-source-text">
        {evidence.transcript ?? "No transcript is available yet."}
      </p>
      <ul>
        {evidence.attachments.map((file) => (
          <li key={file.id}>
            <a href={`/api/projects/${projectId}/files/${file.id}`}>
              {file.filename ?? `Original ${file.kind}`}
            </a>
            <span className="g-metadata"> · {file.content_type}</span>
          </li>
        ))}
      </ul>
      <h3>Operation and correction history</h3>
      {evidence.operations.length === 0 ? (
        <p>No applied operations are linked yet.</p>
      ) : (
        evidence.operations.map((operation) => (
          <section key={operation.operation_id}>
            <p>
              {operation.status.replaceAll("_", " ")} · Version{" "}
              {operation.project_version}
            </p>
            {operation.state_diff.map((diff, index) => (
              <dl
                key={`${diff.entity_id}-${index}`}
                className="workspace-details"
              >
                <dt>{diff.entity_type}</dt>
                <dd>{diff.entity_id}</dd>
                <dt>Before</dt>
                <dd>
                  <pre>{JSON.stringify(diff.before, null, 2)}</pre>
                </dd>
                <dt>After</dt>
                <dd>
                  <pre>{JSON.stringify(diff.after, null, 2)}</pre>
                </dd>
              </dl>
            ))}
          </section>
        ))
      )}
    </Card>
  );
}
