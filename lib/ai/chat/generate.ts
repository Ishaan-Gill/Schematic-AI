import { generateSQLPrompt } from "@/lib/ai/prompts/generate-sql-prompt";
import { groq } from "@/lib/ai/client";
import { DEBUG } from "@/lib/config/debug";
import { quoteIdentifier } from "@/lib/utils/sqlHelpers";
import type { ConversationEntry } from "@/lib/ai/context/buildConversationContext";
import type { Relationship } from "../context/relationships";
import { ToolResult } from "../orchestrator/types";

type GenerateSQLParams = {
  query: string;
  schemas: Record<string, any[]>;
  relevantTables: string[];
  relationships: Relationship[];
  finalDatasetContext: Record<string, any>;
  timeHint?: string;
  conversationContext: ConversationEntry[];
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
    } = params;

    const safeDatasetContext: Record<string, any> = finalDatasetContext ?? {};

    const finalRelevantTables =
      relevantTables?.length > 0 ? relevantTables : Object.keys(schemas);

    const filteredSchemas = Object.fromEntries(
      Object.entries(schemas).filter(([tableName]) =>
        finalRelevantTables?.includes(tableName),
      ),
    );

    const schemaText = Object.entries(filteredSchemas)
      .slice(0, 8)
      .map(([tableName, cols]) => {
        const colText = (cols as any[])
          .slice(0, 30)
          .map(
            (col: any) =>
              `${quoteIdentifier(col.column_name)} (${col.column_type})`,
          )
          .join(", ");
        return `${tableName}: ${colText}`;
      })
      .join("\n\n");

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

    let completion;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
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
        });
        break;
      } catch (err) {
        console.error(`Groq attempt (generate-sql) ${attempt} failed:`, err);

        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    if (!completion) {
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
