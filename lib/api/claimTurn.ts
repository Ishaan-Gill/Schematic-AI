import { createClient } from "@/lib/supabase/server";

export type ClaimTurnResult = "claimed" | "already-claimed" | "quota-exceeded";

export async function claimTurn(
  userId: string,
  turnId: string,
  limit = 20,
): Promise<ClaimTurnResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("claim_turn", {
    p_user_id: userId,
    p_turn_id: turnId,
    p_limit: limit,
  });

  if (error) throw error;

  if (data === 1) return "claimed";
  if (data === 2) return "already-claimed";

  return "quota-exceeded";
}