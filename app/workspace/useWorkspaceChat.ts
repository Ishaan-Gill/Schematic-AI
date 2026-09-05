"use client";

import { useState } from "react";
import React from "react";
import { getRelationships } from "@/lib/ai/context/rebuildRelationshipMemory";
import { dataQuery } from "@/lib/ai/core/dataQuery";
import { executePage } from "@/lib/ai/core/executePage";
import { Message, Session } from "@/types/chat";
import { conversational } from "@/lib/ai/core/conversational";
import { reasoning } from "@/lib/ai/core/reasoning";
import { buildConversationContext } from "@/lib/ai/context/buildConversationContext";
import { llmOrchestrate } from "@/lib/ai/core/llmOrchestrate";
import { answerDatasetMetadata } from "@/lib/ai/core/datasetMetadata";
import { dataAnalysis } from "@/lib/ai/core/dataAnalysis";
import { createSession } from "@/lib/chat/createSession";
import { appendMessage } from "@/lib/chat/appendMessages";
import { updateStoredMessage } from "@/lib/chat/updateMessage";
import { updateSession } from "@/lib/chat/updateSession";
import { datasetMemory } from "@/lib/upload/metadata/datasetMemory";
import { buildCurrencyNormalizationNotes } from "@/lib/metadata/detectCurrency";
import type { AbortControllerBundle } from "./useAbortControllers";
import type { SchemaMap } from "./useWorkspaceData";
import type { ShowToast } from "./useToasts";

const PAGE_SIZE = 100;
const MAX_TITLE_LENGTH = 70;

export type WorkspaceChatDeps = {
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  activeSessionId: string | null;
  setActiveSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  schemas: SchemaMap;
  userId: string | null | undefined;
  workspaceReady: boolean;
  workspaceError: string | null;
  showToast: ShowToast;
  abort: AbortControllerBundle;
};

// Owns everything message/query-shaped: message state updates, paged
// execution, and the full send pipeline (metadata fast-path → orchestrate →
// conversational / reasoning / data-query → analysis). Receives workspace
// state as arguments; the page stays a composition layer.
export function useWorkspaceChat(deps: WorkspaceChatDeps) {
  const {
    sessions,
    setSessions,
    activeSessionId,
    setActiveSessionId,
    schemas,
    userId,
    workspaceReady,
    workspaceError,
    showToast,
    abort,
  } = deps;

  const [isSending, setIsSending] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const updateMessage = (
    messageId: string,
    updates: Partial<Message>,
    sessionId = activeSessionId,
  ) => {
    if (!sessionId) return;

    setSessions((prev) =>
      prev.map((session) =>
        session.id !== sessionId
          ? session
          : {
              ...session,
              messages: session.messages.map((message) =>
                message.id === messageId ? { ...message, ...updates } : message,
              ),
            },
      ),
    );
  };

  const completeFailedRequest = (
    messageId: string,
    sessionId: string,
    controller: AbortController,
    error: string,
  ) => {
    if (!abort.isMountedRef.current) return;

    updateMessage(
      messageId,
      {
        error: controller.signal.aborted ? "Request cancelled." : error,
        loading: false,
      },
      sessionId,
    );
  };

  const executeQuery = async (
    sql?: string,
    assistantMessageId = "",
    page = 0,
    sessionId?: string,
  ): Promise<Record<string, unknown>[] | undefined> => {
    if (!workspaceReady) return;
    const controller = abort.startController(abort.queryControllerRef);

    if (!sql) return;

    return await executePage({
      sql: sql.trim(),
      page: page,
      PAGE_SIZE,
      signal: controller.signal,
      guard: () => abort.isControllerActive(controller),
      assistantMessageId: assistantMessageId!,
      sessionId,
      updateMessage: (messageId, updates) =>
        updateMessage(messageId, updates, sessionId),
    });
  };

  const handleSendMessage = async (query: string): Promise<void> => {
    if (workspaceError) {
      showToast("error", workspaceError, "Workspace unavailable");
      return;
    }
    if (!workspaceReady) {
      showToast("info", "Workspace is still loading. Please wait.");
      return;
    }
    if (isSending) return;
    setIsSending(true);
    try {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: query,
        timestamp: new Date().toISOString(),
      };
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        generatedSQL: "",
        queryResult: [],
        page: 0,
        hasMore: false,
        loading: true,
        loadingStage: "understanding",
        timestamp: new Date().toISOString(),
      };

      let sessionId: string;

      const truncatedQuery =
        query.length > MAX_TITLE_LENGTH
          ? query.slice(0, MAX_TITLE_LENGTH)
          : query;
      if (!activeSession) {
        const newSession: Session = {
          id: crypto.randomUUID(),
          title: truncatedQuery,
          messages: [userMessage, assistantMessage],
        };
        sessionId = newSession.id;
        try {
          await createSession({
            id: newSession.id,
            title: truncatedQuery,
          });
        } catch (err) {
          console.error(err);
          showToast("error", "Failed to create session.");
          return;
        }
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
      } else {
        sessionId = activeSession.id;
        if (activeSession.messages.length === 0) {
          setSessions((prev) =>
            prev.map((session) =>
              session.id === sessionId
                ? {
                    ...session,
                    title: truncatedQuery,
                    messages: [
                      ...session.messages,
                      userMessage,
                      assistantMessage,
                    ],
                  }
                : session,
            ),
          );
          await updateSession({
            sessionId: sessionId,
            title: truncatedQuery,
          });
        } else {
          setSessions((prev) =>
            prev.map((session) =>
              session.id === sessionId
                ? {
                    ...session,
                    messages: [
                      ...session.messages,
                      userMessage,
                      assistantMessage,
                    ],
                  }
                : session,
            ),
          );
        }
      }

      await appendMessage({
        sessionId,
        message: userMessage,
      });
      await appendMessage({
        sessionId,
        message: assistantMessage,
      });

      updateMessage(
        assistantMessage.id,
        {
          error: undefined,
        },
        sessionId,
      );

      const controller = abort.startController(abort.generateControllerRef);
      abort.queryControllerRef.current?.abort();
      updateMessage(
        assistantMessage.id,
        {
          page: 0,
          hasMore: false,
        },
        sessionId,
      );
      const conversationContext = buildConversationContext(
        activeSession?.messages ?? [],
      );
      const turnId = crypto.randomUUID();

      const metadataAnswer = answerDatasetMetadata({ query, schemas });
      if (metadataAnswer) {
        updateMessage(
          assistantMessage.id,
          { content: metadataAnswer, loading: false },
          sessionId,
        );
        await updateStoredMessage({
          id: assistantMessage.id,
          updates: { content: metadataAnswer },
        });
        return;
      }

      const decision = await llmOrchestrate({
        query,
        conversationContext,
        schemas,
        turnId,
        signal: controller.signal,
        guard: () => abort.isControllerActive(controller),
      });

      if (!decision.ok) {
        completeFailedRequest(
          assistantMessage.id,
          sessionId,
          controller,
          decision.cancelled ? "Request cancelled." : decision.error,
        );
        return;
      }

      const { intent, needsAnalysis } = decision.data;

      switch (intent) {
        case "CONVERSATIONAL":
          {
            const response = await conversational({
              query,
              conversationContext,
              turnId,
              signal: controller.signal,
              guard: () => abort.isControllerActive(controller),
            });
            if (!response.ok) {
              completeFailedRequest(
                assistantMessage.id,
                sessionId,
                controller,
                response.cancelled ? "Request cancelled." : response.error,
              );
              return;
            }
            updateMessage(
              assistantMessage.id,
              {
                content: response.data,
                loading: false,
              },
              sessionId,
            );
            await updateStoredMessage({
              id: assistantMessage.id,
              updates: {
                content: response.data,
              },
            });
          }
          break;

        case "REASONING":
          {
            const response = await reasoning({
              query,
              schemas,
              relationships: getRelationships(),
              conversationContext,
              turnId,
              signal: controller.signal,
              guard: () => abort.isControllerActive(controller),
            });
            if (!response.ok) {
              completeFailedRequest(
                assistantMessage.id,
                sessionId,
                controller,
                response.cancelled ? "Request cancelled." : response.error,
              );
              return;
            }
            updateMessage(
              assistantMessage.id,
              {
                content: response.data,
                loading: false,
              },
              sessionId,
            );
            await updateStoredMessage({
              id: assistantMessage.id,
              updates: {
                content: response.data,
              },
            });
          }
          break;

        case "DATA_QUERY":
          {
            updateMessage(
              assistantMessage.id,
              { loadingStage: "checking" },
              sessionId,
            );
            const result = await dataQuery({
              query,
              schemas,
              relationships: getRelationships(),
              conversationContext,
              turnId,
              finalDatasetContext: {},
              userId,
              signal: controller.signal,
              guard: () => abort.isControllerActive(controller),
            });
            if (!result.ok) {
              updateMessage(
                assistantMessage.id,
                {
                  error: result.error.message,
                  loading: false,
                },
                sessionId,
              );
              return;
            }

            const {
              sql,
              rows,
              displayedRowCount,
              hasMore,
              relevantTables,
              finalDatasetContext,
              warnings,
            } = result.data;
            updateMessage(
              assistantMessage.id,
              {
                generatedSQL: sql,
                queryResult: rows,
                hasMore,
                displayedRowCount,
                relevantTables,
                finalDatasetContext,
                warnings: warnings.length > 0 ? warnings : undefined,
                loadingStage: "analyzing",
              },
              sessionId,
            );
            await updateStoredMessage({
              id: assistantMessage.id,
              updates: {
                generatedSQL: sql,
                queryResult: rows,
                hasMore,
                displayedRowCount,
                relevantTables,
                finalDatasetContext,
              },
            });

            if (!rows) return;

            const currencyNotes = buildCurrencyNormalizationNotes(
              Object.fromEntries(
                relevantTables
                  .map((table) => [table, datasetMemory[table]?.profile])
                  .filter(([, profile]) => profile),
              ),
              relevantTables,
            );
            updateMessage(
              assistantMessage.id,
              {
                normalizationNotes: currencyNotes,
              },
              sessionId,
            );
            if (needsAnalysis) {
              const answer = await dataAnalysis({
                query,
                sql,
                rows,
                displayedRowCount,
                hasMore,
                schemas,
                relevantTables,
                relationships: getRelationships(),
                finalDatasetContext,
                conversationContext,
                turnId,
                normalizationNotes: currencyNotes,
                userId,
                signal: controller.signal,
                guard: () => abort.isControllerActive(controller),
              });
              if (!answer.ok) {
                completeFailedRequest(
                  assistantMessage.id,
                  sessionId,
                  controller,
                  answer.cancelled ? "Request cancelled." : answer.error,
                );
                return;
              }

              updateMessage(
                assistantMessage.id,
                {
                  content: answer.data,
                  loading: false,
                },
                sessionId,
              );
              await updateStoredMessage({
                id: assistantMessage.id,
                updates: {
                  content: answer.data,
                },
              });
            } else {
              updateMessage(
                assistantMessage.id,
                {
                  loading: false,
                },
                sessionId,
              );
            }
          }
          break;
      }
    } finally {
      setIsSending(false);
    }
  };

  return { isSending, executeQuery, handleSendMessage, updateMessage };
}
