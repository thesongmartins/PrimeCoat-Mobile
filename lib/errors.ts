/** User-facing messages for Supabase / network failures. Never shows raw SQL or tokens. */
export class AppError extends Error {
  constructor(message: string, public readonly code: string = "UNKNOWN", public readonly status?: number) {
    super(message);
  }
}

type SupabaseLikeError = { message?: string; code?: string; status?: number } | null | undefined;

export function isAuthError(error: unknown): boolean {
  const e = error as SupabaseLikeError;
  return (
    e?.status === 401 ||
    e?.code === "PGRST301" ||
    e?.code === "PGRST303" ||
    (error instanceof AppError && error.code === "AUTH_REQUIRED") ||
    /jwt|AUTH_REQUIRED/i.test(e?.message ?? "")
  );
}

export function isNetworkError(error: unknown): boolean {
  const msg = (error as SupabaseLikeError)?.message ?? "";
  return /network request failed|failed to fetch|network|timed? ?out/i.test(msg);
}

export function toUserMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof AppError) return error.message;
  if (isNetworkError(error)) return "You appear to be offline. Check your connection and try again.";
  if (isAuthError(error)) return "Your session has expired. Please sign in again.";
  return fallback;
}

/** Errors from a request that will fail the same way if retried. */
export function isPermanentError(error: unknown): boolean {
  if (error instanceof AppError) return error.status !== undefined && error.status < 500;
  const e = error as SupabaseLikeError;
  return isAuthError(error) || (typeof e?.code === "string" && /^(PGRST|22|23|42)/.test(e.code));
}
