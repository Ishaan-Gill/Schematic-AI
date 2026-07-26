import { quoteIdentifier } from "@/lib/utils/sqlHelpers";
import type { DuckConnection } from "@/types/duckdb";

export async function dropTableOrView(conn: DuckConnection, name: string) {
  const quoted = quoteIdentifier(name);
  try {
    await conn.query(`DROP VIEW IF EXISTS ${quoted}`);
  } catch (err) {
    if (
      err instanceof Error &&
      /Existing object is of type/.test(err.message)
    ) {
      await conn.query(`DROP TABLE IF EXISTS ${quoted}`);
      return;
    }
    throw err;
  }
}
