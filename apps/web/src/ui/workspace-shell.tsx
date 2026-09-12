import { useState, type ReactNode } from "react";
import { Button } from "./button";
import { StatusBadge } from "./status-badge";
export function WorkspaceShell({
  projectName,
  runLabel,
  connection = "disconnected",
  children,
  activity,
  account,
}: {
  projectName: string;
  runLabel: string;
  connection?: "connected" | "disconnected";
  children: ReactNode;
  activity?: ReactNode;
  account?: ReactNode;
}) {
  const [recording, setRecording] = useState(false);
  return (
    <div className={`g-shell ${recording ? "g-shell--recording" : ""}`}>
      <a className="g-skip-link" href="#workspace-content">
        Skip to workspace
      </a>
      <header className="g-shell-header">
        <a className="g-brand" href="/">
          Ground
        </a>
        <div className="g-project-identity">
          <strong>{projectName}</strong>
          <span>{runLabel}</span>
        </div>
        <div className="g-shell-tools">
          <StatusBadge status={connection} />
          <Button
            variant="secondary"
            aria-pressed={recording}
            onClick={() => setRecording(!recording)}
          >
            Recording view
          </Button>
          {account}
        </div>
      </header>
      {connection === "disconnected" && (
        <p role="status" className="g-connection-warning">
          Connection lost. Showing the last available state.
        </p>
      )}
      <div className="g-workspace-grid">
        <main id="workspace-content" className="g-card-area" tabIndex={-1}>
          {children}
        </main>
        {activity && (
          <aside className="g-activity" aria-label="Project activity">
            {activity}
          </aside>
        )}
      </div>
    </div>
  );
}
