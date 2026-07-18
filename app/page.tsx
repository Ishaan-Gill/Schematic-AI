"use client";
import { useEffect, useRef, useState } from "react";
import FileUpload from "@/components/ui/FileUpload";
import Sidebar from "@/components/ui/Sidebar";
import ChatPanel from "@/components/ui/ChatPanel";
import EmptyChat from "@/components/ui/EmptyChat";
import {
  getRelationshipsMemory,
  relationshipsMemory,
} from "@/lib/ai/context/relationshipsMap";
import { generateSQL } from "@/lib/sql/generateSQL";
import { runQuery } from "@/lib/sql/runQuery";
import { handleFile } from "@/lib/upload/uploadDataset";
import React from "react";
import { Message, Session } from "@/types/chat";
import type { StoredDataset } from "@/types/datasets";
import { ToastItem } from "@/types/toast";
import ToastContainer from "@/components/ui/ToastContainer";
import { classifyIntent } from "@/lib/ai/core/classifyIntent";
import { conversational } from "@/lib/ai/core/conversational";
import { reasoning } from "@/lib/ai/core/reasoning";
import { explainSQL } from "@/lib/ai/core/explainSQL";
import { buildConversationContext } from "@/lib/ai/context/buildConversationContext";
import { ambiguous } from "@/lib/ai/core/ambiguous";
import { rehydrateDuckDB } from "@/lib/duckdb/rehydrateDuckDB";
import { deleteDataset } from "@/lib/upload/deleteDataset";
import { deleteWorkspaceDataset } from "@/lib/workspace/deleteWorkspaceDataset";
import { createSession } from "@/lib/chat/createSession";
import { appendMessage } from "@/lib/chat/appendMessages";
import { updateStoredMessage } from "@/lib/chat/updateMessage";
import { fetchSessions } from "@/lib/chat/fetchSessions";
import { updateSession } from "@/lib/chat/updateSession";
import { deleteSession } from "@/lib/chat/deleteSession";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

type SchemaMap = Record<string, unknown[]>;

const PAGE_SIZE = 100;
const MAX_TITLE_LENGTH = 70;
export default function Home() {
  const [datasets, setDatasets] = useState<StoredDataset[]>([]);
  const [query, setQuery] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [schemas, setSchemas] = useState<SchemaMap>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [user, setUser] = useState<import("@supabase/supabase-js").User | null>(null);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const uploadControllerRef = useRef<AbortController | null>(null);
  const queryControllerRef = useRef<AbortController | null>(null);
  const generateControllerRef = useRef<AbortController | null>(null);
  const fixAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  const startController = (
    ref: React.MutableRefObject<AbortController | null>,
  ) => {
    ref.current?.abort();
    const controller = new AbortController();
    ref.current = controller;
    return controller;
  };
  const isControllerActive = (controller: AbortController) =>
    isMountedRef.current && !controller.signal.aborted;

  const executeQuery = async (
    sql?: string,
    assistantMessageId = "",
    page = 0,
    sessionId?: string,
  ): Promise<Record<string, unknown>[] | undefined> => {
    const controller = startController(queryControllerRef);
    fixAttemptsRef.current = 0;

    if (!sql) return;

    return await runQuery({
      sql: sql.trim(),
      query,
      schemas,
      relationships: getRelationshipsMemory(),
      page: page,
      PAGE_SIZE,
      signal: controller.signal,
      guard: () => isControllerActive(controller),
      fixAttemptsRef,
      assistantMessageId: assistantMessageId!,
      updateMessage: (messageId, updates) =>
        updateMessage(messageId, updates, sessionId),
    });
  };

  useEffect(() => {
    const uploadController = uploadControllerRef;
    const queryController = queryControllerRef;
    const generateController = generateControllerRef;
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      uploadController.current?.abort();
      queryController.current?.abort();
      generateController.current?.abort();
    };
  }, []);

  const showToast = (type: ToastItem["type"], message: string) => {
    setToasts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        message,
      },
    ]);
  };

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initWorkspace() {
      try {
        showToast("info", "Preparing your workspace...");

        const { datasets } = await rehydrateDuckDB();

        setDatasets(datasets);

        const restoredSchemas = Object.fromEntries(
          datasets.map((d) => [d.table_name, d.schema]),
        );
        setSchemas(restoredSchemas);

        const restoredSessions = await fetchSessions();

        setSessions(restoredSessions);

        if (restoredSessions.length > 0) {
          setActiveSessionId(restoredSessions[0].id);
        }

        if (!cancelled) {
          setWorkspaceReady(true);
        }

        showToast("success", "Workspace ready");
      } catch (err) {
        console.error(err);

        showToast("error", "Workspace failed to load");

        if (!cancelled) {
          setWorkspaceReady(true);
        }
      }
    }
    initWorkspace();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const latestSQL = [...(activeSession?.messages ?? [])]
    .reverse()
    .find((m) => m.generatedSQL)?.generatedSQL;

  const handleNewChat = async () => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
    };

    await createSession({
      id: newSession.id,
      title: newSession.title,
    });

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

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

  const handleSendMessage = async (query: string): Promise<void> => {
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

    const controller = startController(generateControllerRef);
    queryControllerRef.current?.abort();
    updateMessage(
      assistantMessage.id,
      {
        page: 0,
        hasMore: false,
      },
      sessionId,
    );
    const intent = await classifyIntent({
      query,
      schemas,
      signal: controller.signal,
      guard: () => isControllerActive(controller),
    });

    switch (intent) {
      case "CONVERSATIONAL":
        {
          const response = await conversational({
            query,
            signal: controller.signal,
            guard: () => isControllerActive(controller),
          });
          if (!response) return;
          updateMessage(
            assistantMessage.id,
            {
              content: response,
              loading: false,
            },
            sessionId,
          );
          await updateStoredMessage({
            id: assistantMessage.id,
            updates: {
              content: response,
            },
          });
        }
        break;

      case "REASONING":
        {
          const response = await reasoning({
            query,
            schemas,
            relationships: getRelationshipsMemory(),
            signal: controller.signal,
            guard: () => isControllerActive(controller),
          });
          if (!response) return;
          updateMessage(
            assistantMessage.id,
            {
              content: response,
              loading: false,
            },
            sessionId,
          );
          await updateStoredMessage({
            id: assistantMessage.id,
            updates: {
              content: response,
            },
          });
        }
        break;

      case "DATA_QUERY":
        {
          const conversationContext = buildConversationContext(
            activeSession?.messages ?? [],
          );
          const result = await generateSQL({
            query,
            schemas,
            conversationContext,
            signal: controller.signal,
            guard: () => isControllerActive(controller),
          });
          if (!result.ok) {
            updateMessage(
              assistantMessage.id,
              {
                error: result.error,
                loading: false,
              },
              sessionId,
            );
            return;
          }

          const sql = result.sql;
          updateMessage(
            assistantMessage.id,
            {
              generatedSQL: sql,
              content: "Analyzing data...",
              loading: false,
            },
            sessionId,
          );
          await updateStoredMessage({
            id: assistantMessage.id,
            updates: {
              generatedSQL: sql,
              content: "Analyzing data...",
            },
          });
          const rows = await executeQuery(
            sql,
            assistantMessage.id,
            0,
            sessionId,
          );

          if (!rows) return;

          const explanation = await explainSQL({
            query,
            sql,
            result: rows ?? [],
            schemas,
            relationships: getRelationshipsMemory(),
            relevantTables: result.relevantTables,
            finalDatasetContext: result.finalDatasetContext,
            signal: controller.signal,
            guard: () => isControllerActive(controller),
          });
          if (!explanation) return;

          updateMessage(
            assistantMessage.id,
            {
              content: explanation,
            },
            sessionId,
          );
          await updateStoredMessage({
            id: assistantMessage.id,
            updates: {
              content: explanation,
            },
          });
        }
        break;

      case "AMBIGUOUS":
        {
          const response = await ambiguous({
            query,
            signal: controller.signal,
            guard: () => isControllerActive(controller),
          });
          if (!response) return;
          updateMessage(
            assistantMessage.id,
            {
              content: response,
              loading: false,
            },
            sessionId,
          );
          await updateStoredMessage({
            id: assistantMessage.id,
            updates: {
              content: response,
            },
          });
        }
        break;
    }
  };

  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, title: newTitle } : s,
      ),
    );
    try {
      await updateSession({ sessionId, title: newTitle });
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to rename session.");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const ok = confirm("Delete this chat?\n\nThis action cannot be undone.");

    if (!ok) return;

    try {
      await deleteSession({ sessionId });

      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);

      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0]?.id ?? null);
      }

      showToast("success", "Chat deleted.");
    } catch (err) {
      console.error(err);

      showToast("error", "Failed to delete chat.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const controller = startController(uploadControllerRef);
    queryControllerRef.current?.abort();
    generateControllerRef.current?.abort();

    await handleFile(e, {
      setDatasets,
      setQuery,
      setSchemas,
      signal: controller.signal,
      guard: () => isControllerActive(controller),
      showToast,
    });
  };

  const handleDeleteDataset = async (dataset: StoredDataset) => {
    const ok = confirm(
      `Delete "${dataset.table_name}"?\n\nThis action cannot be undone.`,
    );

    if (!ok) return;

    try {
      await deleteDataset(dataset);

      setDatasets((prev) =>
        prev.filter((d) => d.table_name !== dataset.table_name),
      );

      setSchemas((prev) => {
        const next = { ...prev };
        delete next[dataset.table_name];
        return next;
      });

      await deleteWorkspaceDataset({ dataset });

      showToast("success", `"${dataset.table_name}" deleted from storage.`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to delete dataset.");
    }
  };

  const latestAssistantLoading =
    [...(activeSession?.messages ?? [])]
      .reverse()
      .find((m) => m.role === "assistant")?.loading ?? false;

  const isEmptyChat = (activeSession?.messages?.length ?? 0) === 0;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#030405] text-zinc-100 md:h-screen md:flex-row">
      <ToastContainer toasts={toasts} setToasts={setToasts} />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_-10%,rgba(34,211,238,0.14),transparent_34rem),radial-gradient(circle_at_95%_20%,rgba(255,255,255,0.055),transparent_26rem),linear-gradient(180deg,#030405_0%,#06080a_48%,#020303_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:72px_72px]" />

      <Sidebar
        datasets={datasets}
        relationships={relationshipsMemory}
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        handleNewChat={handleNewChat}
        onRenameSession={handleRenameSession}
        onDeleteDataset={handleDeleteDataset}
        onDeleteSession={handleDeleteSession}
        userInitial={user?.email?.charAt(0).toUpperCase() ?? "?"}
      />

      <div className="relative flex min-h-0 flex-1 flex-col md:ml-[220px] md:overflow-y-auto">
        {isEmptyChat ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <EmptyChat />
            <div className="mt-8 w-full">
              <FileUpload
                query={query}
                setQuery={setQuery}
                loading={latestAssistantLoading}
                onSend={handleSendMessage}
                onFileChange={handleFileChange}
              />
            </div>
          </div>
        ) : (
          <>
            <ChatPanel
              messages={activeSession?.messages ?? []}
              hasResults={Boolean(latestSQL)}
              updateMessage={updateMessage}
              executeQuery={executeQuery}
            />

            <div className="fixed bottom-0 left-0 right-0 z-20 md:left-[220px]">
              <div className="pointer-events-none h-24 bg-gradient-to-b from-transparent via-[#0a0b0e]/30 to-[#0a0b0e]" />
              <div className="bg-[#0a0b0e] px-6 pb-4 pt-3">
                <FileUpload
                  query={query}
                  setQuery={setQuery}
                  loading={latestAssistantLoading}
                  onSend={handleSendMessage}
                  onFileChange={handleFileChange}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
