import type { DuckConnection } from "@/types/duckdb";

// Validation queries should be fast parser checks. Without a timeout a hung
// EXPLAIN leaves the UI waiting with no feedback (execution paths already
// time out via their own 8s guards).
export const EXPLAIN_TIMEOUT_MS = 8000;

export class ExplainTimeoutError extends Error {
  constructor() {
    super("Query validation timed out.");
    this.name = "ExplainTimeoutError";
  }
}

export async function explainWithTimeout(
  conn: DuckConnection,
  sql: string,
): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new ExplainTimeoutError());
    }, EXPLAIN_TIMEOUT_MS);
  });

  try {
    await Promise.race([conn.query(`EXPLAIN ${sql}`), timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
