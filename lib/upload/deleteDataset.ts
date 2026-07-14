import { createClient } from "@/lib/supabase/client";
import type { StoredDataset } from "@/types/datasets";

export async function deleteDataset(dataset: StoredDataset) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Delete parquet file
  const { error: storageError } = await supabase.storage
    .from("datasets")
    .remove([dataset.storage_path]);

  if (storageError) {
    throw storageError;
  }

  // Delete metadata row
  const { error: dbError } = await supabase
    .from("datasets")
    .delete()
    .eq("user_id", user.id)
    .eq("table_name", dataset.table_name);

  if (dbError) {
    throw dbError;
  }
}