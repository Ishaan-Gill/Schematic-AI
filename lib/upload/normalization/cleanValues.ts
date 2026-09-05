import { quoteIdentifier } from "@/lib/utils/sqlHelpers";
import type { DuckConnection } from "@/types/duckdb";

type ColumnInfo = {
  column_name: string;
};

type CleanValuesArgs = {
  conn: DuckConnection;
  tableName: string;
  columns: ColumnInfo[];
};

export const cleanValues = async ({
  conn,
  tableName,
  columns,
}: CleanValuesArgs) => {
  for (const col of columns) {
    const columnName = col.column_name;

    try {
      await conn.query(`
        UPDATE ${quoteIdentifier(tableName)}
        SET ${quoteIdentifier(columnName)} = NULL
        WHERE TRIM(LOWER(CAST(${quoteIdentifier(columnName)} AS VARCHAR))) IN (
            'n/a',
            'na',
            'null',
            'none',
            'nan',
            'nil',
            'undefined',
            'unknown',
            'missing',
            '#n/a',
            '#ref!',
            '#value!',
            ''
        )
      `);
    } catch (err) {
      console.error(`Failed to normalize values in "${tableName}".`, err);
      throw err;
    }
  }
};
