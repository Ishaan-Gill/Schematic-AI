import { createClient } from "@/lib/supabase/server";

export async function consumeQuota(userId: string, limit = 20): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("check_and_increment_usage", {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) throw error;

  if (!data) {
    throw new Error("Daily quota exceeded");
  }
}
