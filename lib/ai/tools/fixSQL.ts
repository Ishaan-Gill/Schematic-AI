import type { TurnContext, TurnRuntime, ToolResult } from "../orchestrator/types";
import { fixSQLPrompt } from "@/lib/ai/prompts/fix-sql-prompt";
import { groq } from "@/lib/ai/client";

type FixSQLArgs = {
  context: TurnContext;
  runtime: TurnRuntime;
  error: string;
};

export async function fixSQL({
  context,
  runtime,
  error,
}: FixSQLArgs): Promise<ToolResult<{ sql: string }>> {
  try {
    const badSQL = runtime.sql;

    if (!badSQL) {
      return {
        tool: "fix-sql",
        ok: false,
        action: "stop",
        error: {
          code: "NO_SQL",
          message: "No SQL query is available to fix.",
        },
      };
    }

    const prompt = fixSQLPrompt({
      query: context.query,
      error,
      schemas: context.schemas,
      relationships: context.relationships,
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
        console.error(`Groq attempt (fix-sql) ${attempt} failed:`, err);

        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    if (!completion) {
      return {
        tool: "fix-sql",
        ok: false,
        action: "retry",
        error: {
          code: "LLM_NO_RESPONSE",
          message: "AI generation failed while fixing the SQL.",
        },
      };
    }

    const raw = completion.choices[0]?.message?.content || "";

    const xmlMatch = raw.match(/<sql>([\s\S]*?)<\/sql>/i);
    const sql = xmlMatch ? xmlMatch[1].trim() : "";

    if (!sql) {
      return {
        tool: "fix-sql",
        ok: false,
        action: "retry",
        error: {
          code: "SQL_FIX_FAILED",
          message: "AI could not generate a fixed SQL query.",
        },
      };
    }

    const cleanedSQL = sql
      .replace(/```sql|```/g, "")
      .trim();

    const blocked = [
      "drop",
      "delete",
      "update",
      "truncate",
      "insert",
      "alter",
      "create",
    ];

    for (const keyword of blocked) {
      const pattern = new RegExp(`\\b${keyword}\\b`, "i");

      if (pattern.test(cleanedSQL)) {
        return {
          tool: "fix-sql",
          ok: false,
          action: "retry",
          error: {
            code: "DANGEROUS_SQL",
            message: `Fixed SQL contains a blocked operation: ${keyword.toUpperCase()}.`,
          },
        };
      }
    }

    return {
      tool: "fix-sql",
      ok: true,
      data: {
        sql: cleanedSQL,
      },
      action: "continue",
    };
  } catch (err) {
    console.error("fix-sql tool failed:", err);

    return {
      tool: "fix-sql",
      ok: false,
      action: "retry",
      error: {
        code: "FIX_SQL_ERROR",
        message: "Something went wrong while fixing the SQL.",
      },
    };
  }
}