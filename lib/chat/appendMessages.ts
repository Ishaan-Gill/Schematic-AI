import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types/chat";

type AppendMessageArgs = {
  sessionId: string;
  message: Message;
};

export async function appendMessage({
  sessionId,
  message,
}: AppendMessageArgs): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase.from("chat_messages").insert({
    id: message.id,

    session_id: sessionId,

    role: message.role,

    content: message.content,

    generated_sql: message.generatedSQL || null,

    query_result: message.queryResult ?? [],

    page: message.page ?? 0,

    has_more: message.hasMore ?? false,

    timestamp: message.timestamp,
  });

  if (error) {
    throw error;
  }
}
