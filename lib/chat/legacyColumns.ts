// Canonical backwards-compatibility handling for chat_messages columns.
//
// Newer deployments have `displayed_row_count`, `relevant_tables`, and
// `final_dataset_context`; older ones don't. Writes include the new columns
// and, only when the write fails AND the payload actually contains a new
// column, retry once without them. Which columns count as "new" and the
// retry-once behavior live here so both message writers stay identical.

export const NEW_MESSAGE_COLUMNS = [
  "displayed_row_count",
  "relevant_tables",
  "final_dataset_context",
] as const;

export function shouldRetryWithoutNewColumns(
  error: unknown,
  payload: Record<string, unknown>,
): boolean {
  return (
    !!error &&
    NEW_MESSAGE_COLUMNS.some((column) => column in payload)
  );
}

export function stripNewMessageColumns(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([column]) => !NEW_MESSAGE_COLUMNS.includes(column as never),
    ),
  );
}
