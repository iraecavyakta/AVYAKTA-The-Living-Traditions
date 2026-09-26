// Retry helper for handling transient Supabase failures
interface RetryResult {
  data: unknown;
  error: unknown;
}

// Postgrest/Postgres errors that will fail identically on every retry:
// integrity constraint violations (23xxx), insufficient privilege, and
// PostgREST schema/API errors (PGRST*, e.g. "column not found", "no rows").
// Supabase errors carry a `code` like this, not an HTTP `status`.
function isPermanentError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = (error as { code?: string }).code;
  if (typeof code !== "string") return false;
  return code.startsWith("23") || code === "42501" || code.startsWith("PGRST");
}

export async function retryWithBackoff<T extends RetryResult>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 500,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await fn();
      if (!result.error) return result;

      lastError = result.error;

      // Don't retry errors that will fail the same way every time
      if (isPermanentError(result.error)) {
        return result;
      }

      if (attempt < maxAttempts - 1) {
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts - 1) {
        const delay = delayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Return final result with error
  return { data: null, error: lastError } as T;
}

// Wrapper for safe error extraction
export function getSafeErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return (error as { message: string }).message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}
