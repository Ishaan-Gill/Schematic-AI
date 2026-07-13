import { createClient } from "@/lib/supabase/server";

export async function checkDailyQuota(limit = 20) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase.rpc("check_and_increment_usage", {
    p_user_id: user.id,
    p_limit: limit,
  });

  if (error) {
    throw error;
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: usage } = await supabase
    .from("daily_usage")
    .select("query_count")
    .eq("user_id", user.id)
    .eq("usage_date", today)
    .single();

  console.log("Queries used today:", usage?.query_count);

  return data as boolean;
}
