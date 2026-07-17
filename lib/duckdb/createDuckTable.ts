import { escapeSqlString, quoteIdentifier } from "@/lib/utils/sqlHelpers";
import type { DuckConnection, DuckDatabase } from "@/types/duckdb";

type CreateDuckTableArgs = {
  db: DuckDatabase;
  conn: DuckConnection;
  tableName: string;
  tempName: string;
  csvText: string;
};

export const createDuckTable = async ({
  db,
  conn,
  tableName,
  tempName,
  csvText,
}: CreateDuckTableArgs) => {
  await db.registerFileText(tempName, csvText);
  try {
    await conn.query(`
        CREATE TABLE ${quoteIdentifier(tableName)} AS
        SELECT * FROM read_csv_auto(
            '${escapeSqlString(tempName)}',
            strict_mode = false,
            ignore_errors = true,
            null_padding = true,
            parallel = false
        )
    `);
  } finally {
    await db.dropFile(tempName);
  }
};
