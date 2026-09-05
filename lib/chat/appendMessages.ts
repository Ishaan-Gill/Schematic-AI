import { createClient } from "@/lib/supabase/client";
import { toJsonSafe } from "@/lib/chat/toJsonSafe";
import {
  shouldRetryWithoutNewColumns,
  stripNewMessageColumns,
} from "@/lib/chat/legacyColumns";
import type { Message } from "@/types/chat";

type AppendMessageArgs = {
  sessionId: string;
  message: Message;
};

const buildPayload = (message: Message, sessionId: string) => ({
  id: message.id,
  session_id: sessionId,
  role: message.role,
  content: message.content,
  generated_sql: message.generatedSQL || null,
  query_result: message.queryResult ? toJsonSafe(message.queryResult) : [],
  page: message.page ?? 0,
  has_more: message.hasMore ?? false,
  displayed_row_count: message.displayedRowCount ?? null,
  relevant_tables:
    message.relevantTables !== undefined
      ? toJsonSafe(message.relevantTables)
      : null,
  final_dataset_context:
    message.finalDatasetContext !== undefined
      ? toJsonSafe(message.finalDatasetContext)
      : null,
  timestamp: message.timestamp,
});

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

  const { data: session, error: sessionError } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    throw new Error("Session does not belong to the current user.");
  }

  const payload = buildPayload(message, sessionId);

  let { error } = await supabase.from("chat_messages").insert(payload);

  if (shouldRetryWithoutNewColumns(error, payload)) {
    ({ error } = await supabase
      .from("chat_messages")
      .insert(stripNewMessageColumns(payload)));
  }

  if (error) {
    throw error;
  }
}