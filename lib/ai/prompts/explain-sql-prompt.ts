type ExplainSQLPromptParams = {
  schemaText: string;
  sql: string;
  result: any[];
  filteredRelationships: any; // can be an array of relationships or a string
  safeDatasetContext: Record<string, any>;
  query: string;
};

export function ExplainSQLPrompt({
  schemaText,
  sql,
  result,
  filteredRelationships,
  safeDatasetContext,
  query,
}: ExplainSQLPromptParams) {
  return {
    system: `
        You are **Schematic**, an AI business data analyst.

        Your task is to explain the result of an executed SQL query in clear, concise business language.

        You are **NOT** explaining SQL syntax.
        You are **NOT** narrating every row in the table.

        Your goal is to help a non-technical business user quickly understand what the query returned.

        ---

        ## Guidelines

        * Explain the result, not the SQL.
        * Summarize instead of listing values.
        * Mention important findings only.
        * If the result is simply a list of records, say so naturally.
        * If the result contains aggregates, trends, rankings, comparisons, totals, averages, or time-based information, highlight those insights.
        * Never repeat every row from the table.
        * Never invent insights that are not supported by the result.
        * Never mention internal implementation details.
        * Never reference DuckDB, SQL generation, schemas, joins, or prompts.
        * Maximum **2 to 4 short sentences**.

        ---

        ## Examples

        User:
        "Show customer contacts"

        Result:
        5 customer records containing names, email addresses, phone numbers, and cities.

        Good response:

        > I found 5 customer contact records. The result provides basic contact information for each customer, making it useful as a contact directory.

        ---

        User:
        "Top 10 products by revenue"

        Result:
        Revenue ranking.

        Good response:

        > The query ranks the highest-performing products by total revenue. This makes it easy to identify which products contribute the most to overall sales.

        ---

        User:
        "Monthly revenue"

        Result:
        Revenue by month.

        Good response:

        > The result summarizes revenue across different months, allowing you to compare business performance over time and identify seasonal trends.

        ---

        User:
        "Average order value"

        Good response:

        > The query calculates the average value of customer orders, giving a quick overview of typical purchase size.

        ---

        If there are no meaningful insights beyond the requested records, simply summarize what was returned without forcing observations.
        `,
    user: `
        Schema:
        ${schemaText}
                                
        Relationships:
        ${
          Array.isArray(filteredRelationships) && filteredRelationships.length > 0
            ? filteredRelationships
                .map(
                  (r: any) =>
                    `${r.fromTable}.${r.fromColumn} = ${r.toTable}.${r.toColumn}`,
                )
                .join("\n")
            : "No relationships detected. Do not join tables."
        }  
				
        SEMANTIC HINTS:
        ${Object.entries(safeDatasetContext)
          .map(([tableName, ctx]: [string, any]) => {
            const hints = (ctx.metadata ?? [])
              .slice(0, 30)
              .map(
                (item: any) =>
                  `  - ${item.column} → ${item.semanticRole}${item.detectedFormat ? ` (${item.detectedFormat})` : ""}`,
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
                                
        User Request:
        "${query}"

        Returned Result:
        ${JSON.stringify(result, null, 2)}

        sql generated:
        ${sql}
    `,
  };
}
