import { useEffect, useState, type ReactNode } from "react";
import { sessionSchema, type Session } from "@ground/contracts";
import {
  apiRequest,
  ApiRequestError,
  emptyResponseSchema,
} from "../../lib/api-client";
import { Button, ErrorState, LoadingState, messages } from "../../ui";
import { LoginPage } from "./login-page";
import { authMessages } from "./messages";
export { LoginPage } from "./login-page";
export { safeReturnPath } from "./return-path";
export function AuthBoundary({
  children,
}: {
  children: (session: Session) => ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [expired, setExpired] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/api/session", {
      schema: sessionSchema,
      signal: controller.signal,
    })
      .then(setSession)
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof ApiRequestError && cause.status === 401)
          setExpired(cause.detail.message === "Session expired");
        else
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not check your session.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  if (loading)
    return (
      <div className="g-auth-message">
        <LoadingState label={authMessages.checking} />
      </div>
    );
  if (error)
    return (
      <div className="g-auth-message">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  if (!session)
    return (
      <LoginPage
        {...(expired ? { reason: "expired" as const } : {})}
        onSignedIn={setSession}
      />
    );
  return <>{children(session)}</>;
}
export function SignOutButton({ csrfToken }: { csrfToken: string }) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null);
  async function signOut() {
    setPending(true);
    setError(null);
    try {
      await apiRequest("/api/session", {
        schema: emptyResponseSchema,
        method: "DELETE",
        csrfToken,
      });
      window.location.assign("/login");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign out.");
      setPending(false);
    }
  }
  return (
    <>
      <Button
        variant="secondary"
        loading={pending}
        onClick={() => void signOut()}
      >
        {messages.signOut}
      </Button>
      {error && <ErrorState message={error} />}
    </>
  );
}
export function ForbiddenState() {
  return (
    <div className="g-auth-message">
      <ErrorState message={authMessages.forbidden} />
      <a href="/">Return to your workspace</a>
    </div>
  );
}
