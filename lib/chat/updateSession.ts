import { createClient } from "@/lib/supabase/client";

type UpdateSessionArgs = {
  sessionId: string;
  title: string;
};

export async function updateSession({
  sessionId,
  title,
}: UpdateSessionArgs): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("chat_sessions")
    .update({
      title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}