import { useState, type FormEvent } from "react";
import { sessionSchema, type Session } from "@ground/contracts";
import { apiRequest, ApiRequestError } from "../../lib/api-client";
import { Button, Field, ErrorState } from "../../ui";
import { authMessages as copy } from "./messages";
import { safeReturnPath } from "./return-path";
export function LoginPage({
  reason,
  onSignedIn,
}: {
  reason?: "expired" | "forbidden";
  onSignedIn?: (session: Session) => void;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const username = form.get("username"),
      password = form.get("password");
    if (typeof username !== "string" || typeof password !== "string") return;
    setPending(true);
    setError(null);
    try {
      const session = await apiRequest("/api/session", {
        schema: sessionSchema,
        method: "POST",
        body: { username, password },
      });
      const destination = safeReturnPath(
        new URLSearchParams(window.location.search).get("returnTo"),
        session.project_ids,
      );
      if (!destination) {
        setError(copy.noProject);
        return;
      }
      if (onSignedIn) {
        window.history.replaceState(null, "", destination);
        onSignedIn(session);
      } else window.location.assign(destination);
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError
          ? cause.status === 401
            ? copy.invalid
            : cause.message
          : "Sign-in could not be completed. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="g-login-layout">
      <aside className="g-login-intro">
        <a className="g-brand" href="/">
          Ground
        </a>
        <div>
          <h1>{copy.intro}</h1>
          <p>{copy.description}</p>
        </div>
        <div className="g-login-caption">Field reports. Clear decisions.</div>
      </aside>
      <main className="g-login-main">
        <form className="g-login-form" onSubmit={(event) => void submit(event)}>
          <header>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </header>
          {reason && <p role="status">{copy[reason]}</p>}
          {error && <ErrorState message={error} />}
          <Field
            label={copy.username}
            name="username"
            autoComplete="username"
            required
            disabled={pending}
          />
          <Field
            label={copy.password}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={pending}
          />
          <Button type="submit" loading={pending}>
            {pending ? copy.submitting : copy.submit}
          </Button>
          <p className="g-login-note">{copy.demo}</p>
        </form>
      </main>
    </div>
  );
}
