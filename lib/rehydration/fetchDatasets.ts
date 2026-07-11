import { createClient } from "@/lib/supabase/client";

export async function fetchDatasets() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("datasets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at");

  if (error) {
    throw error;
  }

  return data;
}
