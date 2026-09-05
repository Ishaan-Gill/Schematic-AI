import { executeSQL } from "@/lib/ai/tools/executeSQL";
import { isActive } from "@/lib/ai/isActive";
import { updateStoredMessage } from "@/lib/chat/updateMessage";
import { buildExecutableSQL } from "@/lib/sql/buildExecutableSQL";
import { validateSQL } from "@/lib/sql/validateSQL";

type ExecutePageArgs = {
  sql: string;
  page: number;
  PAGE_SIZE: number;
  signal?: AbortSignal;
  guard?: () => boolean;
  assistantMessageId: string;
  updateMessage: (
    id: string,
    updates: Partial<import("@/types/chat").Message>,
    sessionId?: string,
  ) => void;
  sessionId?: string;
};

export const executePage = async ({
  sql,
  page,
  PAGE_SIZE,
  signal,
  guard,
  assistantMessageId,
  updateMessage,
  sessionId,
}: ExecutePageArgs): Promise<Record<string, unknown>[] | undefined> => {
  if (!isActive(guard, signal)) return;

  updateMessage(assistantMessageId, { error: undefined }, sessionId);

  const { finalQuery } = buildExecutableSQL({ sql, page, PAGE_SIZE });

  const validationError = await validateSQL({ sql: finalQuery });
  if (!isActive(guard, signal)) return;

  if (validationError) {
    updateMessage(
      assistantMessageId,
      { error: validationError, loading: false },
      sessionId,
    );
    return;
  }

  const result = await executeSQL({
    runtime: { attempts: 0, sql },
    page,
    PAGE_SIZE,
    signal,
    guard,
  });

  if (!result.ok) {
    updateMessage(
      assistantMessageId,
      { error: result.error.message, loading: false },
      sessionId,
    );
    return;
  }

  const { rows, hasMore } = result.data;

  updateMessage(
    assistantMessageId,
    { queryResult: rows, hasMore, loading: false },
    sessionId,
  );

  try {
    await updateStoredMessage({
      id: assistantMessageId,
      updates: {
        queryResult: rows,
        hasMore,
      },
    });
  } catch (err) {
    // Persistence is best-effort; local state already shows the new page.
    console.error("Failed to persist paged results:", err);
  }

  return rows;
};
