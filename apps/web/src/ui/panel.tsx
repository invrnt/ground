import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./button";
import { messages } from "./messages";
export function Panel({
  title,
  children,
  modal = false,
  open = true,
  onClose,
}: {
  title: string;
  children: ReactNode;
  modal?: boolean;
  open?: boolean;
  onClose?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!modal || !dialog) return;
    const previous = document.activeElement;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [modal, open]);
  if (!modal)
    return open ? (
      <section className="g-panel" aria-labelledby={titleId}>
        <h2 id={titleId}>{title}</h2>
        {children}
      </section>
    ) : null;
  return (
    <dialog
      ref={ref}
      className="g-panel g-panel--modal"
      aria-labelledby={titleId}
      onCancel={onClose}
      onClose={onClose}
    >
      <header className="g-panel-header">
        <h2 id={titleId}>{title}</h2>
        <Button
          variant="secondary"
          onClick={() => {
            ref.current?.close();
          }}
          aria-label={`Close ${title}`}
        >
          {messages.close}
        </Button>
      </header>
      {children}
    </dialog>
  );
}
