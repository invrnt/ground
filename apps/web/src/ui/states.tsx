import type { ReactNode } from "react";
import { Button } from "./button";
import { messages } from "./messages";
export function LoadingState({ label = messages.loading }: { label?: string }) {
  return (
    <p role="status" className="g-state">
      <span className="g-spinner" aria-hidden="true" />
      {label}
    </p>
  );
}
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="g-state g-empty">
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="g-state g-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {messages.retry}
        </Button>
      )}
    </div>
  );
}
