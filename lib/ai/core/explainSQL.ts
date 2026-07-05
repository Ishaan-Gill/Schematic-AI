import type { Relationship } from "../context/relationships";

type ExplainSQLArgs = {
  query: string;
  sql: string;
  result: Record<string, unknown>[];
  schemas: Record<string, any[]>;
  relationships: Relationship[];
  relevantTables: string[];
  finalDatasetContext: Record<string, any>;
  signal?: AbortSignal;
  guard?: () => boolean;
};

const isActive = (guard?: () => boolean, signal?: AbortSignal) =>
  !signal?.aborted && (guard?.() ?? true);

export const explainSQL = async ({
  query,
  sql,
  result,
  schemas,
  relationships,
  relevantTables,
  finalDatasetContext,
  signal,
  guard,
}: ExplainSQLArgs) => {
  try {
    if (!isActive(guard, signal)) return;

    const body = {
      query,
      sql,
      result,
      schemas,
      relationships,
      relevantTables,
      finalDatasetContext,
    };

    const res = await fetch("/api/explain-sql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify(body, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    });
    const data = await res.json();
    if (!isActive(guard, signal)) return;

    if (!res.ok) {
      throw new Error(data.error ?? "explanation failed");
    }

    return data.response as string;
  } catch (err) {
    if (signal?.aborted) return;
    console.error("explanation failed:", err);
  }
};
