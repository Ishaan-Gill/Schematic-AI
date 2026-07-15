import { createClient } from "@/lib/supabase/client";

type CreateSessionArgs = {
  id: string;
  title: string;
};

export async function createSession({
  id,
  title,
}: CreateSessionArgs): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("chat_sessions")
    .insert({
      id,
      user_id: user.id,
      title,
    });

  if (error) {
    throw error;
  }
}