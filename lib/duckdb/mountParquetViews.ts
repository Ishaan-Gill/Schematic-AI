import { createClient } from "@/lib/supabase/client";
import { quoteIdentifier } from "@/lib/utils/quoteIdentifier";
import type { DuckConnection } from "@/types/duckdb";

export async function mountParquetViews(
  conn: DuckConnection,
  datasets: any[]
) {
  const supabase = createClient();

  for (const dataset of datasets) {
    const { data, error } = await supabase.storage
      .from("datasets")
      .createSignedUrl(dataset.storage_path, 600);

    if (error) {
      throw error;
    }

    const url = data.signedUrl;

    await conn.query(`
      CREATE OR REPLACE VIEW
      ${quoteIdentifier(dataset.table_name)}
      AS
      SELECT *
      FROM read_parquet('${url}')
    `);
  }
}