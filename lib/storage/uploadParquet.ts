import { createClient } from "@/lib/supabase/client";
import { DEBUG } from "@/lib/config/debug";

type UploadParquetArgs = {
  parquetBytes: Uint8Array;
  userId: string;
  datasetName: string;
};

export async function uploadParquet({
  parquetBytes,
  userId,
  datasetName,
}: UploadParquetArgs) {
  const safeBytes = new Uint8Array(parquetBytes);

  const blob = new Blob([safeBytes], {
    type: "application/octet-stream",
  });

  const fileName = datasetName.trim().replace(/\s+/g, "_");

  const storagePath = `${userId}/${fileName}.parquet`;
  const supabase = createClient();

  const { error } = await supabase.storage
    .from("datasets")
    .upload(storagePath, blob, {
      upsert: true,
    });
  if (error) {
    console.error(error);
    throw error;
  }

  if (DEBUG) console.log(storagePath);
  if (DEBUG) console.log(blob.size);

  return { storagePath, filesize: blob.size };
}
