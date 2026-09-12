import { apiErrorSchema, type ApiError } from "@ground/contracts";
export class ApiRequestError extends Error {
  constructor(
    public readonly detail: ApiError,
    public readonly status: number,
  ) {
    super(detail.message);
    this.name = "ApiRequestError";
  }
}
export interface ResponseSchema<T> {
  parse(value: unknown): T;
}
export interface RequestOptions<T> {
  schema: ResponseSchema<T>;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  csrfToken?: string;
  idempotencyKey?: string;
  signal?: AbortSignal;
}
/** No automatic mutation retries. Reuse an explicit idempotency key when retrying an uncertain request. */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions<T>,
): Promise<T> {
  if (!path.startsWith("/api/") || path.includes("\\") || path.startsWith("//"))
    throw new Error("API requests must use a local /api/ path");
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") {
    headers["Idempotency-Key"] = options.idempotencyKey ?? crypto.randomUUID();
    if (options.csrfToken) headers["X-CSRF-Token"] = options.csrfToken;
  }
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers,
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiRequestError(
      {
        code: "PROVIDER_UNAVAILABLE",
        message:
          method === "GET"
            ? "Could not connect to Ground. Check your connection and try again."
            : "The connection ended before Ground confirmed the result. Check the current state before trying again.",
        retryable: method === "GET",
      },
      0,
    );
  }
  const data: unknown =
    response.status === 204
      ? undefined
      : await response.json().catch(() => undefined);
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(data);
    throw new ApiRequestError(
      parsed.success
        ? parsed.data
        : {
            code:
              response.status === 401
                ? "UNAUTHORIZED"
                : response.status === 403
                  ? "FORBIDDEN"
                  : "INTERNAL_ERROR",
            message: "Ground could not complete this request.",
            retryable: false,
          },
      response.status,
    );
  }
  try {
    return options.schema.parse(data);
  } catch {
    throw new ApiRequestError(
      {
        code: "INTERNAL_ERROR",
        message:
          "Ground returned an unexpected response. Refresh the page to try again.",
        retryable: false,
      },
      response.status,
    );
  }
}
export const emptyResponseSchema: ResponseSchema<void> = {
  parse(value) {
    if (value !== undefined) throw new Error("Expected an empty response");
  },
};
