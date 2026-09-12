import { statusLabels, type Status } from "./messages";
const tones: Partial<Record<Status, string>> = {
  failed: "error",
  blocked: "warning",
  uncertain: "warning",
  needs_review: "warning",
  disconnected: "warning",
  sent: "success",
  completed: "success",
  connected: "success",
  synced: "success",
};
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`g-status g-status--${tones[status] ?? "neutral"}`}>
      {statusLabels[status]}
    </span>
  );
}
