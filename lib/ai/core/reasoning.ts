import { getDuckDB } from "@/lib/duckdb";
import { buildSQLContext } from "../context/buildSQLContext";
import { Relationship } from "../context/relationships";

type ReasoningArgs = {
  query: string;
  schemas: Record<string, any[]>;
  relationships: Relationship[];
  signal?: AbortSignal;
  guard?: () => boolean;
};

export const reasoning = async ({
  query,
  schemas,
  relationships,
  signal,
  guard,
}: ReasoningArgs) => {

  
  let conn: any = null;
  try {
    const db = await getDuckDB();
    conn = await db.connect();
    
    if (signal?.aborted || !(guard?.() ?? true)) return;

    const { finalDatasetContext } = await buildSQLContext({
      conn,
      tables: Object.keys(schemas),
      schemas,
    });

    const res = await fetch("/api/reasoning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        query,
        schemas,
        relationships,
        finalDatasetContext,
      }),
    });
    const data = await res.json();
    if (signal?.aborted || !(guard?.() ?? true)) return;

    if (!res.ok) {
      throw new Error(data.error ?? "Reasoning failed");
    }

    return data.response as string;
  } catch (err) {
    if (signal?.aborted) return;
    console.error("Reasoning failed:", err);
  } finally {
    if (conn) await conn.close();
  }
};
