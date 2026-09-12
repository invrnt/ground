import { useEffect, useState, type FormEvent } from "react";
import {
  reportSnapshotSchema,
  queryAnswerSchema,
  externalObjectLinkSchema,
  type ReportSnapshot,
  type QueryAnswer,
  type ExternalObjectLink,
} from "@ground/contracts";
import { apiRequest } from "../../lib/api-client";
import { formatDate, formatTimestamp } from "../../lib/formatters";
import {
  Card,
  Button,
  Field,
  ErrorState,
  LoadingState,
  EvidenceLink,
} from "../../ui";
import "./reports.css";
export function QueryWidget({
  projectId,
  csrfToken,
}: {
  projectId: string;
  csrfToken: string;
}) {
  const [answer, setAnswer] = useState<QueryAnswer | null>(null),
    [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null);
  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const text = new FormData(event.currentTarget).get("question");
    if (typeof text !== "string") return;
    setPending(true);
    setError(null);
    try {
      setAnswer(
        await apiRequest(`/api/projects/${projectId}/queries`, {
          schema: queryAnswerSchema,
          method: "POST",
          body: { text },
          csrfToken,
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not retrieve the project answer.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Card title="Ask about this project">
      <form className="report-query" onSubmit={(event) => void ask(event)}>
        <Field
          name="question"
          label="Question"
          placeholder="What is needed tomorrow?"
          required
          maxLength={500}
          help="Inventory, progress, open issues, assignments or tomorrow's needs."
          disabled={pending}
        />
        <Button type="submit" loading={pending}>
          Ask Ground
        </Button>
      </form>
      {error && <ErrorState message={error} />}{" "}
      {answer && (
        <div className="report-answer" role="status">
          <p>{answer.answer}</p>
          <p className="g-metadata">
            Project version {answer.version} · {formatDate(answer.date)}
          </p>
          {answer.evidence_ids.map((id) => (
            <EvidenceLink
              key={id}
              projectId={projectId}
              evidenceId={id}
              type="Source"
            >
              View supporting evidence
            </EvidenceLink>
          ))}
        </div>
      )}
    </Card>
  );
}
export function ReportView({
  projectId,
  date,
}: {
  projectId: string;
  date: string;
}) {
  const [report, setReport] = useState<ReportSnapshot | null>(null),
    [links, setLinks] = useState<ExternalObjectLink[]>([]),
    [error, setError] = useState<string | null>(null),
    [linksError, setLinksError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setReport(null);
    setError(null);
    void apiRequest(`/api/projects/${projectId}/reports/${date}`, {
      schema: reportSnapshotSchema,
      signal: controller.signal,
    })
      .then(setReport)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Report could not be loaded.",
          );
      });
    void apiRequest(`/api/projects/${projectId}/reports/${date}/links`, {
      schema: externalObjectLinkSchema.array(),
      signal: controller.signal,
    })
      .then(setLinks)
      .catch(() => {
        if (!controller.signal.aborted) setLinksError(true);
      });
    return () => controller.abort();
  }, [projectId, date]);
  if (error) return <ErrorState message={error} />;
  if (!report) return <LoadingState label="Loading the persisted report…" />;
  return (
    <Card
      title={`Site report · ${formatDate(report.date)}`}
      actions={
        <a
          className="g-button g-button--primary"
          href={`/api/projects/${projectId}/reports/${date}.pdf?version=${report.version}`}
        >
          Download PDF · Version {report.version}
        </a>
      }
    >
      <p className="g-metadata">
        Version {report.version} · Generated{" "}
        {formatTimestamp(report.generated_at)}
      </p>
      {report.sections.map((section) => (
        <section key={section.title} className="report-section">
          <h3>{section.title}</h3>
          <p>{section.text}</p>
        </section>
      ))}
      <section>
        <h3>Evidence</h3>
        {report.evidence_ids.length ? (
          report.evidence_ids.map((id) => (
            <EvidenceLink
              key={id}
              projectId={projectId}
              evidenceId={id}
              type="Source"
            >
              View original evidence
            </EvidenceLink>
          ))
        ) : (
          <p>No source evidence linked.</p>
        )}
      </section>
      <section>
        <h3>Office document</h3>
        {linksError ? (
          <p>Office sync metadata is unavailable.</p>
        ) : links.length ? (
          links.map((link) => {
            let url: string | null = null;
            try {
              const value = new URL(link.remote_url);
              if (
                value.protocol === "https:" &&
                !value.username &&
                !value.password
              )
                url = value.href;
            } catch {
              /* Invalid remote URLs are displayed without a link. */
            }
            return (
              <p key={link.remote_id}>
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    Ambiguous report
                  </a>
                ) : (
                  "Ambiguous report link unavailable"
                )}{" "}
                · {link.sync_status} · Synced version {link.synced_version},
                local report version {report.version}
              </p>
            );
          })
        ) : (
          <p>No visible office document link yet.</p>
        )}
      </section>
    </Card>
  );
}
