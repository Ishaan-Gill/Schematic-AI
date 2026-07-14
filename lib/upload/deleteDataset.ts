import { createClient } from "@/lib/supabase/client";

type DeleteDatasetArgs = {
  tableName: string;
  storagePath: string;
};

export async function deleteDataset({
  tableName,
  storagePath,
}: DeleteDatasetArgs) {
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
    .remove([storagePath]);

  if (storageError) {
    throw storageError;
  }

  // Delete metadata row
  const { error: dbError } = await supabase
    .from("datasets")
    .delete()
    .eq("user_id", user.id)
    .eq("table_name", tableName);

  if (dbError) {
    throw dbError;
  }
}