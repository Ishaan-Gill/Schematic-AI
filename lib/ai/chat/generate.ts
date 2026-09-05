// Server-only Groq executor (called by app/api/* routes — never import from client components).
import { generateSQLPrompt } from "@/lib/ai/prompts/generate-sql-prompt";
import { formatTypedSchemaText } from "@/lib/ai/prompts/shared";
import { groq } from "@/lib/ai/client";
import { groqWithRetry } from "@/lib/ai/groqRetry";
import { DEBUG } from "@/lib/config/debug";
import { checkSQLSafetySync } from "@/lib/sql/sqlSafety";
import { validateAgainstSchema } from "@/lib/sql/validateSchema";
import type { ConversationEntry } from "@/lib/ai/context/buildConversationContext";
import type { Relationship } from "../context/relationships";
import { ToolResult } from "../core/types";

type GenerateSQLParams = {
  query: string;
  schemas: Record<string, any[]>;
  relevantTables: string[];
  relationships: Relationship[];
  finalDatasetContext: Record<string, any>;
  timeHint?: string;
  conversationContext: ConversationEntry[];
  signal?: AbortSignal;
};

export async function generateSQL(
  params: GenerateSQLParams,
): Promise<ToolResult<{ sql: string }>> {
  try {
    const {
      query,
      schemas,
      relevantTables,
      relationships,
      finalDatasetContext,
      timeHint,
      conversationContext,
      signal,
    } = params;

    const safeDatasetContext: Record<string, any> = finalDatasetContext ?? {};

    const finalRelevantTables =
      relevantTables?.length > 0 ? relevantTables : Object.keys(schemas);

    const filteredSchemas = Object.fromEntries(
      Object.entries(schemas).filter(([tableName]) =>
        finalRelevantTables?.includes(tableName),
      ),
    );

    const schemaText = formatTypedSchemaText(filteredSchemas);

    const filteredRelationships = relationships.filter(
      (r: any) =>
        finalRelevantTables?.includes(r.fromTable) &&
        finalRelevantTables?.includes(r.toTable),
    );

    const prompt = generateSQLPrompt({
      schemaText,
      filteredRelationships,
      timeHint,
      safeDatasetContext,
      query,
      conversationContext,
    });

    const result = await groqWithRetry({
      label: "generate-sql",
      signal,
      call: () =>
        groq.chat.completions.create(
          {
            model: "openai/gpt-oss-120b",
            temperature: 0.1,
            messages: [
              {
                role: "system",
                content: prompt.system,
              },
              {
                role: "user",
                content: prompt.user,
              },
            ],
          },
          { signal },
        ),
    });

    if (result.status !== "ok") {
      return {
        tool: "generate-sql",
        ok: false,
        action: "retry",
        error: {
          code: "LLM_NO_RESPONSE",
          message:
            "Something went wrong generating your query. Please try again.",
        },
      };
    }

    const completion = result.completion;
    const raw = completion.choices[0]?.message?.content || "";

    if (DEBUG) {
      console.log("AI RAW (generate-sql):", raw);
    }

    const xmlMatch = raw.match(/<sql>([\s\S]*?)<\/sql>/i);
    const sql = xmlMatch ? xmlMatch[1].trim() : "";

    if (!sql) {
      return {
        tool: "generate-sql",
        ok: false,
        action: "retry",
        error: {
          code: "SQL_GENERATION_FAILED",
          message:
            "Something went wrong generating your query. Please try again.",
        },
      };
    }

    if (sql.trim().toUpperCase() === "INVALID_QUERY") {
      return {
        tool: "generate-sql",
        ok: false,
        action: "stop",
        error: {
          code: "INVALID_QUERY",
          message:
            "I couldn't answer this from your uploaded datasets. Try rephrasing your question.",
        },
      };
    }

    // Boundary: LLM output -> safety -> schema allowlist -> EXPLAIN -> execution.
    // Reject hallucinated or dangerous SQL here before it reaches verify/execute.
    const safetyError = checkSQLSafetySync(sql);
    if (safetyError) {
      return {
        tool: "generate-sql",
        ok: false,
        action: "retry",
        error: {
          code: "DANGEROUS_SQL",
          message: safetyError,
        },
      };
    }

    const schemaError = validateAgainstSchema(sql, schemas);
    if (schemaError) {
      const code = schemaError.includes("column")
        ? "COLUMN_NOT_FOUND"
        : "TABLE_NOT_FOUND";
      return {
        tool: "generate-sql",
        ok: false,
        action: "retry",
        error: {
          code,
          message: schemaError,
        },
      };
    }

    return {
      tool: "generate-sql",
      ok: true,
      data: {
        sql,
      },
      action: "continue",
    };
  } catch (err) {
    console.error("generate-sql tool failed:", err);

    return {
      tool: "generate-sql",
      ok: false,
      action: "retry",
      error: {
        code: "GENERATE_SQL_ERROR",
        message:
          "Something went wrong generating your query. Please try again.",
      },
    };
  }
}
