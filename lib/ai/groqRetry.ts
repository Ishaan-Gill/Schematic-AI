import { isActive } from "./isActive";

// Server-only: canonical Groq retry policy used by every LLM call site
// (lib/ai/chat/* executors and app/api/fix-sql). Callers keep their own
// model/temperature/messages via the `call` closure; only the retry
// mechanics live here.
//
// Preserved policy: 2 attempts, 1000ms pause before the final attempt,
// per-attempt error log, immediate stop when the request is no longer
// active (aborted signal or failed guard).

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;

type GroqRetryArgs<T> = {
  // Inserted into the log line: `Groq attempt (${label}) ${attempt} failed:`
  label: string;
  signal?: AbortSignal;
  guard?: () => boolean;
  call: () => Promise<T>;
};

export type GroqRetryResult<T> =
  | { status: "ok"; completion: T }
  | { status: "cancelled" }
  | { status: "failed" };

export async function groqWithRetry<T>({
  label,
  signal,
  guard,
  call,
}: GroqRetryArgs<T>): Promise<GroqRetryResult<T>> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (!isActive(guard, signal)) {
      return { status: "cancelled" };
    }

    try {
      const completion = await call();
      return { status: "ok", completion };
    } catch (err) {
      if (!isActive(guard, signal)) {
        return { status: "cancelled" };
      }

      console.error(`Groq attempt (${label}) ${attempt} failed:`, err);

      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  return { status: "failed" };
}
