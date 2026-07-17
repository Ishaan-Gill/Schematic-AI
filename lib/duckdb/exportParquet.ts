import * as duckdb from "@duckdb/duckdb-wasm";
import { escapeSqlString, quoteIdentifier } from "../utils/sqlHelpers";

export const exportParquet = async (
  db: duckdb.AsyncDuckDB,
  conn: duckdb.AsyncDuckDBConnection,
  tableName: string,
) => {
  const parquetFileName = `${tableName}.parquet`;

  await conn.query(`
        COPY ${quoteIdentifier(tableName)}
        TO '${escapeSqlString(parquetFileName)}'
        (FORMAT PARQUET)
        `);
  console.log("COPY finished");

  const bytes = await db.copyFileToBuffer(parquetFileName);

  return bytes;
};
