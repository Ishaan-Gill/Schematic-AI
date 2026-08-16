import { createClient } from "@/lib/supabase/client";
import { toJsonSafe } from "@/lib/chat/toJsonSafe";
import type { Message } from "@/types/chat";

const NEW_COLUMNS = [
  "displayed_row_count",
  "relevant_tables",
  "final_dataset_context",
] as const;

type UpdateStoredMessageArgs = {
  id: string;
  updates: Partial<Message>;
};

const buildPayload = (updates: Partial<Message>): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  if (updates.content !== undefined) {
    payload.content = updates.content;
  }

  if (updates.generatedSQL !== undefined) {
    payload.generated_sql = updates.generatedSQL;
  }

  if (updates.queryResult !== undefined) {
    payload.query_result = toJsonSafe(updates.queryResult);
  }

  if (updates.page !== undefined) {
    payload.page = updates.page;
  }

  if (updates.hasMore !== undefined) {
    payload.has_more = updates.hasMore;
  }

  if (updates.displayedRowCount !== undefined) {
    payload.displayed_row_count = updates.displayedRowCount;
  }

  if (updates.relevantTables !== undefined) {
    payload.relevant_tables = toJsonSafe(updates.relevantTables);
  }

  if (updates.finalDatasetContext !== undefined) {
    payload.final_dataset_context = toJsonSafe(updates.finalDatasetContext);
  }

  return payload;
};

export async function updateStoredMessage({
  id,
  updates,
}: UpdateStoredMessageArgs): Promise<void> {
  const supabase = createClient();

  const payload = buildPayload(updates);

  // Nothing changed → don't hit the database
  if (Object.keys(payload).length === 0) {
    return;
  }

  let { error } = await supabase
    .from("chat_messages")
    .update(payload)
    .eq("id", id);

  if (error && NEW_COLUMNS.some((column) => column in payload)) {
    const legacyPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([column]) => !NEW_COLUMNS.includes(column as never),
      ),
    );

    ({ error } = await supabase
      .from("chat_messages")
      .update(legacyPayload)
      .eq("id", id));
  }

  if (error) {
    throw error;
  }
}