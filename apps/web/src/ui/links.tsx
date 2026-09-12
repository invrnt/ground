import type { ReactNode } from "react";
import { idSchema } from "@ground/contracts";
import { formatTimestamp } from "../lib/formatters";
export function SourceLink({
  url,
  retrievedAt,
  excerpt,
  timezone,
}: {
  url: string;
  retrievedAt: string;
  excerpt?: string;
  timezone?: string;
}) {
  let source: URL;
  try {
    source = new URL(url);
    if (
      !["https:", "http:"].includes(source.protocol) ||
      source.username ||
      source.password
    )
      throw new Error("Unsafe source");
  } catch {
    return <span>Source link unavailable</span>;
  }
  return (
    <div className="g-source">
      <a
        href={source.href}
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
      >
        {source.hostname}
        <span className="g-sr-only">, opens in a new tab</span>
      </a>
      <span className="g-metadata">
        Retrieved {formatTimestamp(retrievedAt, timezone)}
      </span>
      {excerpt && <blockquote>{excerpt}</blockquote>}
    </div>
  );
}
export function EvidenceLink({
  projectId,
  evidenceId,
  type,
  children,
}: {
  projectId: string;
  evidenceId: string;
  type: string;
  children: ReactNode;
}) {
  const project = idSchema.parse(projectId),
    evidence = idSchema.parse(evidenceId);
  return (
    <a
      href={`/projects/${project}/evidence/${evidence}`}
      className="g-evidence-link"
    >
      {children}
      <span className="g-metadata">{type}</span>
    </a>
  );
}
