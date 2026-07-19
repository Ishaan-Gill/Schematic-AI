import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types/chat";

type UpdateStoredMessageArgs = {
  id: string;
  updates: Partial<Message>;
};

export async function updateStoredMessage({
  id,
  updates,
}: UpdateStoredMessageArgs): Promise<void> {
  const supabase = createClient();

  const payload: Record<string, unknown> = {};

  if (updates.content !== undefined) {
    payload.content = updates.content;
  }

  if (updates.generatedSQL !== undefined) {
    payload.generated_sql = updates.generatedSQL;
  }

  if (updates.queryResult !== undefined) {
    payload.query_result = updates.queryResult;
  }

  if (updates.page !== undefined) {
    payload.page = updates.page;
  }

  if (updates.hasMore !== undefined) {
    payload.has_more = updates.hasMore;
  }

  // Nothing changed → don't hit the database
  if (Object.keys(payload).length === 0) {
    return;
  }

  const { error } = await supabase
    .from("chat_messages")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw error;
  }
}