import { getDuckDB } from "@/lib/duckdb";
import { isFollowUpQuery, isTimeQuery } from "@/lib/ai/followUp";
import { updateDetectedRelationships } from "@/lib/upload/metadata/detectRelationships";
import { validateSQL } from "./validateSQL";
import { feedbackMemory } from "@/lib/upload/metadata/feedbackMemory";
import {
  detectTableRelevance,
  expandRelevantTables,
} from "@/lib/ai/context/detectTableRelevance";
import { buildSQLContext } from "../ai/context/buildSQLContext";

type GenerateSQLArgs = {
  query: string;
  schemas: Record<string, any[]>;
  lastSQL: string;
  setLastSQL: React.Dispatch<React.SetStateAction<string>>;
  signal?: AbortSignal;
  guard?: () => boolean;
};

type GenerateSQLResult =
  | {
      ok: true;
      sql: string;
    }
  | {
      ok: false;
      error: string;
    };

const isActive = (guard?: () => boolean, signal?: AbortSignal) =>
  !signal?.aborted && (guard?.() ?? true);

export const generateSQL = async ({
  query,
  schemas,
  lastSQL,
  setLastSQL,
  signal,
  guard,
}: GenerateSQLArgs): Promise<GenerateSQLResult> => {
  const relationships = updateDetectedRelationships(schemas);
  const isFollowUp = isFollowUpQuery(query, lastSQL);
  const relevantTables = detectTableRelevance(query, schemas);
  const finalRelevantTables = expandRelevantTables(
    relevantTables,
    relationships,
  );
  const CANCELLED: GenerateSQLResult = {
    ok: false,
    error: "Request Cancelled.",
  };

  if (finalRelevantTables.length === 0) {
    return {
      ok: false,
      error: "No datasets loaded. Please upload a file first.",
    };
  }

  let conn: any = null;
  try {
    const db = await getDuckDB();
    conn = await db.connect();

    if (!isActive(guard, signal)) return CANCELLED;

    const { sampleRowsByTable, finalDatasetContext } = await buildSQLContext({
      conn,
      tables: finalRelevantTables,
      schemas,
    });

    // Time hint
    const timeHint = isTimeQuery(query)
      ? `
                Time-based analytics query.
                Prefer DATE_TRUNC, EXTRACT, proper date filtering,
                and relative date logic where appropriate.
            `
      : "";

    const endpoint =
      isFollowUp && lastSQL ? "/api/edit-sql" : "/api/generate-sql";
    const body =
      endpoint === "/api/edit-sql"
        ? { query, lastSQL, schemas, relationships, isFollowUp }
        : {
            query,
            schemas,
            relevantTables: finalRelevantTables,
            relationships,
            sampleRowsByTable,
            finalDatasetContext,
            feedbackMemory,
            timeHint,
          };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify(body, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: data.error || "Something went wrong. Please try again.",
      };
    }

    if (!isActive(guard, signal)) return CANCELLED;

    if (!isFollowUp) setLastSQL("");

    if (!data.sql) {
      return {
        ok: false,
        error: "Something went wrong. Please try again.",
      };
    }

    // validateSQL:
    const validationError = await validateSQL({
      sql: data.sql,
    });
    if (validationError) {
      return {
        ok: false,
        error: validationError,
      };
    }

    const freshSQL = data.sql;
    setLastSQL(freshSQL);

    return {
      ok: true,
      sql: freshSQL,
    };
  } catch (err) {
    if (signal?.aborted) return CANCELLED;
    console.error("AI error:", err);
    return {
      ok: false,
      error: "Something went wrong. Please try again.",
    };
  } finally {
    if (conn) await conn.close();
  }
};
