type GenerateSQLPromptParams = {
  schemaText: string;
  filteredRelationships: string;
  timeHint?: string;
  safeDatasetContext: Record<string, any>;
  filteredSampleText: string;
  recentFailures: any[];
  query: string;
};

export function generateSQLPrompt({
  schemaText,
  filteredRelationships,
  timeHint,
  safeDatasetContext,
  filteredSampleText,
  recentFailures,
  query,
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
                    
        Sample Data:
        ${filteredSampleText}
                                
        Recent Failed Queries:
        ${JSON.stringify(recentFailures)}
                                
        User Request:
        "${query}"
    `,
  };
}
