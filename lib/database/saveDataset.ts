import { createClient } from "@/lib/supabase/client";
import type { StoredDataset } from "@/types/datasets";

export async function saveDataset(dataset: StoredDataset) {
    const supabase = createClient();

    const { error } = await supabase
        .from("datasets")
        .insert(dataset);

    if (error) {
        console.error(error);
        throw error;
    }
}