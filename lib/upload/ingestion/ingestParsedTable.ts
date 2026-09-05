import { cleanValues } from "../normalization/cleanValues";
import { inferColumnTypes } from "../normalization/inferColumnTypes";
import { detectCurrenciesInTable } from "./detectCurrencies";
import { validateTable } from "../validation/validateTable";
import { createDuckTable } from "../../duckdb/createDuckTable";
import { profileTable } from "./profileTable";

import { datasetMemory } from "../metadata/datasetMemory";

import { inferSemanticContext } from "@/lib/metadata/semanticInference";

import type { ParsedTable } from "../parsers/parseExcel";
import { quoteIdentifier } from "@/lib/utils/sqlHelpers";
import { exportParquet } from "@/lib/duckdb/exportParquet";
import { createClient } from "@/lib/supabase/client";
import { uploadParquet } from "@/lib/storage/uploadParquet";
import type { DuckDatabase, DuckConnection } from "@/types/duckdb";
import { saveDataset } from "@/lib/database/saveDataset";
import type { StoredDataset } from "@/types/datasets";
import { mountParquetViews } from "@/lib/duckdb/mountParquetViews";
import { dropTableOrView } from "@/lib/duckdb/dropObject";
import { rebuildRelationshipMemory } from "@/lib/ai/context/rebuildRelationshipMemory";

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

  if (!parsedTable.csvText || !parsedTable.csvText.trim()) {
    throw new Error(`This file appears to be empty.`);
  }

  const tempName = `${tableName}.csv`;

  await dropTableOrView(conn, tableName);

  await createDuckTable({
    db,
    conn,
    tableName,
    tempName,
    csvText,
  });

  if (!isActive()) return null;

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

  // Currency detection runs on raw values before type inference strips symbols
  const currencyDetections = await detectCurrenciesInTable(
    conn,
    tableName,
    columns,
  );

  // null cleaning
  await cleanValues({
    conn,
    tableName,
    columns,
  });

  // type inference
  const coercionWarnings = await inferColumnTypes(conn, tableName);

  // refreshed schema
  const refreshedColumnsResult = await conn.query(`
    DESCRIBE ${quoteIdentifier(tableName)}
  `);

  const refreshedColumns = refreshedColumnsResult.toArray() as ColumnInfo[];

  // validation
  validateTable({
    rowCount,
    columns: refreshedColumns,
  });

  // profiling
  const profile = await profileTable({
    conn,
    tableName,
    columns: refreshedColumns,
  });

  // merge currency detection into per-column profile
  for (const [columnName, detection] of Object.entries(currencyDetections)) {
    if (profile[columnName]) {
      profile[columnName].currency = detection.currency;
      profile[columnName].currencies = detection.currencies;
      profile[columnName].mixedCurrency = detection.mixedCurrency;
    }
  }

  // merge coercion warnings into per-column profile
  for (const warning of coercionWarnings) {
    if (profile[warning.column]) {
      profile[warning.column].coercionFailedRows = warning.failedRows;
      profile[warning.column].coercionTargetType = warning.targetType;
    }
  }

  // semantic inference
  const semantic = inferSemanticContext(tableName, refreshedColumns, profile);

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
  const relationships = rebuildRelationshipMemory();

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
    coercionWarnings,
    dataset: datasetRecord,
  };
};
