import { cleanValues } from "../normalization/cleanValues";
import { inferColumnTypes } from "../normalization/inferColumnTypes";
import { normalizeHeaders } from "../normalization/normalizeHeaders";
import { validateTable } from "../validation/validateTable";
import { createDuckTable } from "../../duckdb/createDuckTable";
import { profileTable } from "./profileTable";

import { datasetMemory } from "../metadata/datasetMemory";

import { inferSemanticContext } from "@/lib/metadata/semanticInference";

import type { ParsedTable } from "../parsers/parseExcel";
import { buildRelationshipsMemory } from "@/lib/ai/context/relationshipsMap";
import { quoteIdentifier } from "@/lib/utils/quoteIdentifier";
import { exportParquet } from "@/lib/duckdb/exportParquet";
import { createClient } from "@/lib/supabase/client";
import { uploadParquet } from "@/lib/storage/uploadParquet";
import type { DuckDatabase, DuckConnection } from "@/types/duckdb";
import { saveDataset } from "@/lib/database/saveDataset";
import type { StoredDataset } from "@/types/datasets";
import { mountParquetViews } from "@/lib/duckdb/mountParquetViews";

type QueryRow = Record<string, unknown>;

type ColumnInfo = QueryRow & {
  column_name: string;
  column_type: string;
};

type IngestParsedTableArgs = {
  parsedTable: ParsedTable;
  db: DuckDatabase;
  conn: DuckConnection;
  isActive?: () => boolean;
};

export const ingestParsedTable = async ({
  parsedTable,
  db,
  conn,
  isActive = () => true,
}: IngestParsedTableArgs) => {
  const originalTableName = parsedTable.tableName;

  // Adds suffix to same table name:
  let tableName = originalTableName;
  let counter = 2;
  while (datasetMemory[tableName]) {
    tableName = `${originalTableName}_${counter}`;
    counter++;
  }

  const csvText = parsedTable.csvText;

  if (!parsedTable.csvText) {
    throw new Error(`Missing csvText for table: ${tableName}`);
  }

  const tempName = `${tableName}.csv`;

  await conn.query(`
        DROP TABLE IF EXISTS ${quoteIdentifier(tableName)}
    `);

  await createDuckTable({
    db,
    conn,
    tableName,
    tempName,
    csvText,
  });

  if (!isActive()) return null;

  // get parsed schema
  const parsedColumnsResult = await conn.query(`
        DESCRIBE ${quoteIdentifier(tableName)}
    `);

  const parsedColumns = parsedColumnsResult.toArray() as ColumnInfo[];

  // clean headers after duckdb parsing:
  for (const column of parsedColumns) {
    const cleanedHeader = normalizeHeaders([column.column_name])[0];
    if (!cleanedHeader || column.column_name === cleanedHeader) {
      continue;
    }
    await conn.query(`
        ALTER TABLE ${quoteIdentifier(tableName)}
        RENAME COLUMN
        ${quoteIdentifier(column.column_name)}
        TO
        ${quoteIdentifier(cleanedHeader)}
    `);
  }

  // row count
  const rowCountResult = await conn.query(`
        SELECT COUNT(*) AS count
        FROM ${quoteIdentifier(tableName)}
    `);

  const rowCount = Number(rowCountResult.toArray()[0]?.count ?? 0);

  // schema
  const columnsResult = await conn.query(`
        DESCRIBE ${quoteIdentifier(tableName)}
    `);

  const columns = columnsResult.toArray() as ColumnInfo[];

  // null cleaning
  await cleanValues({
    conn,
    tableName,
    columns,
  });

  // type inference
  await inferColumnTypes(conn, tableName);

  // refreshed schema
  const refreshedColumnsResult = await conn.query(`
            DESCRIBE ${quoteIdentifier(tableName)}
        `);

  const refreshedColumns = refreshedColumnsResult.toArray() as ColumnInfo[];

  // profiling
  const profile = await profileTable({
    conn,
    tableName,
    columns: refreshedColumns,
  });

  // semantic inference
  const semantic = inferSemanticContext(tableName, refreshedColumns, profile);

  // validation
  validateTable({
    rowCount,
    columns: refreshedColumns,
  });

  // Memory injection
  datasetMemory[tableName] = {
    schema: refreshedColumns.map((column) => ({
      column_name: column.column_name,
      column_type: String(column.column_type),
    })),
    profile,
    semantic: semantic,
    relationships: [],
    feedback: {
      successfulQueries: [],
      failedQueries: [],
    },
  };
  // Rebuilds relationship:
  const allSchemas = Object.fromEntries(
    Object.entries(datasetMemory).map(([t, d]) => [t, d.schema]),
  );

  const relationships = buildRelationshipsMemory(allSchemas);

  // Clears old relationships:
  for (const table of Object.keys(datasetMemory)) {
    datasetMemory[table].relationships = [];
  }

  // Injects fresh relationships:
  for (const rel of relationships) {
    const fromEntry = datasetMemory[rel.fromTable];
    if (!fromEntry) continue;
    fromEntry.relationships = fromEntry.relationships ?? [];
    fromEntry.relationships.push(rel);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const parquetBytes = await exportParquet(db, conn, tableName);

  const { storagePath } = await uploadParquet({
    parquetBytes,
    userId: user.id,
    datasetName: tableName,
  });

  const datasetRecord: StoredDataset = {
    user_id: user.id,

    table_name: tableName,

    storage_path: storagePath,

    row_count: rowCount,

    schema: refreshedColumns.map((column) => ({
      column_name: column.column_name,
      column_type: String(column.column_type),
    })),

    profile,

    semantic,

    relationships,
  };

  await saveDataset(datasetRecord);

  await conn.query(`
    DROP TABLE IF EXISTS ${quoteIdentifier(tableName)}
  `);

  await mountParquetViews(conn, [
    {
      table_name: tableName,
      storage_path: storagePath,
    },
  ]);

  return {
    tableName,
    columns: refreshedColumns,
    profile,
    dataset: datasetRecord,
  };
};
