import { buildDatasetContext } from "../../metadata/buildDatasetContext";
import { quoteIdentifier } from "../../utils/sqlHelpers";

type BuildSQLContextArgs = {
  conn: any;
  tables: string[];
  schemas: Record<string, any[]>;
};

export async function buildSQLContext({
  conn,
  tables,
  schemas,
}: BuildSQLContextArgs) {
  const sampleRowsByTable: Record<string, any[]> = {};

  for (const tableName of tables) {
    const sampleRows = await conn.query(
      `SELECT * FROM ${quoteIdentifier(tableName)} LIMIT 3`,
    );
    sampleRowsByTable[tableName] = sampleRows.toArray();
  }
  const relevantSchemas = Object.fromEntries(
    tables
      .map((table) => [table, schemas[table]])
      .filter(([, schema]) => schema),
  );
  const finalDatasetContext = buildDatasetContext(
    relevantSchemas,
    sampleRowsByTable,
  );

  return {
    sampleRowsByTable,
    relevantSchemas,
    finalDatasetContext,
  };
}
