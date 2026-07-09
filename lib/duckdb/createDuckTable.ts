import { quoteIdentifier } from "@/lib/utils/quoteIdentifier";
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
  await conn.query(`
        CREATE TABLE ${quoteIdentifier(tableName)} AS
        SELECT * FROM read_csv_auto(
            '${tempName}',
            strict_mode = false,
            ignore_errors = true,
            null_padding = true,
            parallel = false
        )
    `);
};
