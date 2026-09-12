import { useId, type ReactNode } from "react";
export function Card({
  title,
  provider,
  children,
  actions,
  className = "",
}: {
  title: string;
  provider?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  return (
    <section className={`g-card ${className}`} aria-labelledby={titleId}>
      <header className="g-card-header">
        <h2 id={titleId}>{title}</h2>
        {provider && <span className="g-metadata">{provider}</span>}
      </header>
      <div className="g-card-content">{children}</div>
      {actions && <footer className="g-card-actions">{actions}</footer>}
    </section>
  );
}
