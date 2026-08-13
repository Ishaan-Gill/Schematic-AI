import { DuckConnection } from "@/types/duckdb";
import { buildDatasetContext } from "../../metadata/buildDatasetContext";
import { quoteIdentifier } from "../../utils/sqlHelpers";
import { ensureWorkspaceFresh } from "@/lib/duckdb/ensureWorkspaceFresh";
import { datasetMemory } from "@/lib/upload/metadata/datasetMemory";

type BuildSQLContextArgs = {
  conn: DuckConnection;
  tables: string[];
  schemas: Record<string, any[]>;
};

export async function buildSQLContext({
  conn,
  tables,
  schemas,
}: BuildSQLContextArgs) {
  await ensureWorkspaceFresh(conn);

  const sampleRowsByTable: Record<string, any[]> = {};

  for (const tableName of tables) {
    const sampleRows = await conn.query(
      `SELECT * FROM ${quoteIdentifier(tableName)} LIMIT 10`,
    );
    sampleRowsByTable[tableName] = sampleRows.toArray();
  }
  const relevantSchemas = Object.fromEntries(
    tables
      .map((table) => [table, schemas[table]])
      .filter(([, schema]) => schema),
  );
  const profilesByTable = Object.fromEntries(
    tables
      .map((table) => [table, datasetMemory[table]?.profile])
      .filter(([, profile]) => profile),
  );
  const finalDatasetContext = buildDatasetContext(
    relevantSchemas,
    sampleRowsByTable,
    profilesByTable,
  );

  return {
    sampleRowsByTable,
    relevantSchemas,
    finalDatasetContext,
  };
}
