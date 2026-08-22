type GenerateSQLPromptParams = {
  schemaText: string;
  filteredRelationships: any[];
  timeHint?: string;
  safeDatasetContext: Record<string, any>;
  query: string;
  conversationContext: ConversationEntry[];
};

import type { ConversationEntry } from "../context/buildConversationContext";

export function generateSQLPrompt({
  schemaText,
  filteredRelationships,
  timeHint,
  safeDatasetContext,
  query,
  conversationContext,
}: GenerateSQLPromptParams) {
  return {
    system: `
        You are a DuckDB SQL generator.
        
        You must return exactly one XML block containing the SQL query.
        The entire response must be exactly one <sql>...</sql> block.
        Never use markdown code fences.
        Never explain the query.
        Never output text before or after the <sql> block.
        
        Allowed statements:
            SELECT
            WITH
            DESCRIBE
            
        Never generate:
            INSERT
            UPDATE
            DELETE
            DROP
            ALTER
            CREATE
            TRUNCATE
            
        Use ONLY tables and columns from the provided schema.
        Do not use information_schema unless the user explicitly asks for system metadata.

        Column naming rules (CRITICAL):
        - Column names in the schema are the EXACT physical column names stored in the database.
        - They may contain spaces, punctuation, currency symbols ($, ₹, €, £), %, #, parentheses, etc.
        - ALWAYS wrap every table and column identifier in double quotes in your SQL, exactly as shown.
        - NEVER generate or use simplified, normalized, or alias names (use "Customer ID", not customer_id).
        - NEVER strip symbols or casing when referencing column names.
            
        Never invent tables such as:
        - Metadata
        - Semantic_Metadata
        - Data_Dictionary
        - Analytics
        - Relationships
            
        Before returning SQL:
        verify every referenced column exists in the exact referenced table.
            
        If the request cannot be answered from schema:
        return exactly:
        <sql>INVALID_QUERY</sql>
            
        DuckDB rules:
        - Use TRY_STRPTIME instead of STRPTIME
        - Use regexp_matches()
        - Prefer DATE_TRUNC and EXTRACT
        - Use LOWER() for string comparisons

        CATALOG RULES (CRITICAL):
        - Every uploaded dataset is a DuckDB VIEW in the "main" schema.
        - information_schema.tables lists these views with table_type = 'VIEW'
          and table_schema = 'main'. They are NOT base tables.
        - NEVER filter by table_type = 'BASE TABLE' or table_schema = 'public'.
          That matches zero tables and returns an empty result.
        - When the user explicitly asks for system metadata (e.g. "list my
          tables", "how many tables", "what columns does X have"), query
          information_schema.tables or duckdb_views() WITHOUT any schema or
          table_type filter, and do not assume a 'public' schema.
        - When asking for the columns of a specific table, use DESCRIBE
          exactly that table name.

        IMPORTANT:
            
        Only generate DESCRIBE queries when the user explicitly asks:
        - describe table X
        - show schema of X
        - list columns of X
        - inspect structure of X
            
        If the user asks:
        - show X
        - print X
        - display X
        - view X
            
        then generate:
        SELECT * FROM X
        
        Do NOT generate DESCRIBE for data viewing requests.
            
        Only join tables if an explicit relationship is provided.
            
        If no relationship exists between tables:
        do NOT invent joins.
            
        Never assume columns with similar meanings are joinable unless explicitly related.

        CRITICAL: You must return exactly ONE SQL statement, 
        never multiple statements separated by semicolons.

        If the question requires multiple pieces of analysis 
        (e.g. "give min, max, and category breakdown"), combine 
        them into ONE statement using:
        - CTEs (WITH ... AS (...))
        - Window functions (OVER (...))
        - UNION ALL if genuinely combining different row sets

        Never write multiple separate SELECT statements. 
        Always produce a single, self-contained query.
    `,
    user: `
        Schema:
        ${schemaText}
                                
        Relationships:
        ${
          filteredRelationships.length > 0
            ? filteredRelationships
                .map(
                  (r: any) =>
                    `${r.fromTable}.${r.fromColumn} = ${r.toTable}.${r.toColumn}`,
                )
                .join("\n")
            : "No relationships detected. Do not join tables."
        }  
        TIME HINTS:
        ${timeHint ?? ""}
				
        SEMANTIC HINTS:
        ${Object.entries(safeDatasetContext)
          .map(([tableName, ctx]: [string, any]) => {
            const hints = (ctx.metadata ?? [])
              .slice(0, 30)
              .map(
                (item: any) =>
                  `  - ${item.column} → ${item.semanticRole}${item.detectedFormat ? ` (${item.detectedFormat})` : ""}${item.coercionNote ? ` — ${item.coercionNote}` : ""}`,
              )
              .join("\n");
            return `${tableName}:\n${hints}`;
          })
          .join("\n\n")}
                            
        DERIVED METRICS:
        ${Object.entries(safeDatasetContext)
          .map(
            ([tableName, ctx]: [string, any]) =>
              (ctx.metrics ?? [])
                .slice(0, 20)
                .map(
                  (metric: any) =>
                    `- [${tableName}] ${metric.name} = ${metric.expression}`,
                )
                .join("\n") ?? "",
          )
          .join("\n")}

          
        ${
          (() => {
            const sqlContext = conversationContext.filter(
              (ctx) => ctx.sql?.trim(),
            );
            return sqlContext.length > 0
              ? `Recent SQL Context:
          ${sqlContext
            .map(
              (ctx) =>
                `Q:\n${ctx.query}\n\nSQL:\n${ctx.sql}\n\nExplanation:\n${ctx.explanation}`,
            )
            .join("\n\n---\n\n")}

          ---
          If the current question clearly depends on previous SQL context, continue from it.
          If it is unrelated, completely ignore previous context.
          Never force previous context if it does not apply.
          `
              : "";
          })()
        }
                                
        User Request:
        "${query}"
    `,
  };
}
