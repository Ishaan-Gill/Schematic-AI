import { createClient } from "@/lib/supabase/client";

type DeleteSessionArgs = {
  sessionId: string;
};

export async function deleteSession({
  sessionId,
}: DeleteSessionArgs): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}