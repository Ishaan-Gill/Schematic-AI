import { createClient } from "@/lib/supabase/client";
import { quoteIdentifier } from "@/lib/utils/quoteIdentifier";
import type { DuckConnection } from "@/types/duckdb";

export async function mountParquetViews(conn: DuckConnection, datasets: any[]) {
  const supabase = createClient();

  // 1. Generate every signed URL simultaneously
  const signedDatasets = await Promise.all(
    datasets.map(async (dataset) => {
      const { data, error } = await supabase.storage
        .from("datasets")
        .createSignedUrl(dataset.storage_path, 6 * 60 * 60);

      if (error) throw error;

      return {
        table_name: dataset.table_name,
        signedUrl: data.signedUrl,
      };
    }),
  );

  // 2. Create views (can stay sequential)
  for (const dataset of signedDatasets) {
    await conn.query(`
      CREATE OR REPLACE VIEW
      ${quoteIdentifier(dataset.table_name)}
      AS
      SELECT *
      FROM read_parquet('${dataset.signedUrl}')
      `);
  }
}
