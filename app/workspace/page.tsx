"use client";
import { useState } from "react";
import FileUpload from "@/components/ui/FileUpload";
import Sidebar from "@/components/ui/Sidebar";
import ChatPanel from "@/components/ui/ChatPanel";
import EmptyChat from "@/components/ui/EmptyChat";
import { handleFile, uploadDataset } from "@/lib/upload/uploadDataset";
import React from "react";
import type { StoredDataset } from "@/types/datasets";
import type { Session } from "@/types/chat";
import ToastContainer from "@/components/ui/ToastContainer";
import { deleteDataset } from "@/lib/upload/deleteDataset";
import { deleteWorkspaceDataset } from "@/lib/workspace/deleteWorkspaceDataset";
import { createSession } from "@/lib/chat/createSession";
import { updateSession } from "@/lib/chat/updateSession";
import { deleteSession } from "@/lib/chat/deleteSession";
import { useToasts } from "./useToasts";
import { useAbortControllers } from "./useAbortControllers";
import { useWorkspaceData } from "./useWorkspaceData";
import { useWorkspaceChat } from "./useWorkspaceChat";

// Composition layer: wires workspace data + chat + upload hooks to the
// sidebar, chat panel, upload input, and toasts. All pipeline logic lives in
// the hooks and lib/* services below.
export default function Home() {
  const { toasts, setToasts, showToast } = useToasts();
  const abort = useAbortControllers();
  const {
    datasets,
    setDatasets,
    sessions,
    setSessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    schemas,
    setSchemas,
    user,
    workspaceReady,
    workspaceError,
  } = useWorkspaceData(showToast);

  const [query, setQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { isSending, executeQuery, handleSendMessage, updateMessage } =
    useWorkspaceChat({
      sessions,
      setSessions,
      activeSessionId,
      setActiveSessionId,
      schemas,
      userId: user?.id,
      workspaceReady,
      workspaceError,
      showToast,
      abort,
    });

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
    if (isUploading) return;
    setIsUploading(true);
    try {
      const controller = abort.startController(abort.uploadControllerRef);
      abort.queryControllerRef.current?.abort();
      abort.generateControllerRef.current?.abort();

      await handleFile(e, {
        setDatasets,
        setQuery,
        setSchemas,
        signal: controller.signal,
        guard: () => abort.isControllerActive(controller),
        showToast,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    if (isUploading || !files.length) return;
    setIsUploading(true);
    try {
      const controller = abort.startController(abort.uploadControllerRef);
      abort.queryControllerRef.current?.abort();
      abort.generateControllerRef.current?.abort();

      await uploadDataset({
        files,
        setDatasets,
        setQuery,
        setSchemas,
        signal: controller.signal,
        guard: () => abort.isControllerActive(controller),
        showToast,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDataset = async (dataset: StoredDataset) => {
    const ok = confirm(
      `Delete "${dataset.table_name}"?\n\nThis action cannot be undone.`,
    );

    if (!ok) return;

    try {
      await deleteDataset(dataset);

      await deleteWorkspaceDataset({ dataset });

      setDatasets((prev) =>
        prev.filter((d) => d.table_name !== dataset.table_name),
      );

      setSchemas((prev) => {
        const next = { ...prev };
        delete next[dataset.table_name];
        return next;
      });

      showToast("success", `"${dataset.table_name}" deleted from storage.`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to delete dataset.");
    }
  };

  const isEmptyChat = (activeSession?.messages?.length ?? 0) === 0;

  return (
    <div className="workspace-shell relative flex min-h-screen flex-col overflow-hidden bg-workspace-bg text-workspace-text md:h-screen md:flex-row">
      <ToastContainer toasts={toasts} setToasts={setToasts} />

      <Sidebar
        datasets={datasets}
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        handleNewChat={handleNewChat}
        onRenameSession={handleRenameSession}
        onDeleteDataset={handleDeleteDataset}
        onDeleteSession={handleDeleteSession}
        onFileChange={handleFileChange}
        isUploading={isUploading}
        user={user}
      />

      <div className="relative flex min-h-0 flex-1 flex-col md:ml-[220px] md:overflow-y-auto">
        {workspaceError && (
          <div
            role="alert"
            className="mx-6 mt-6 rounded-xl border-2 border-workspace-danger-border bg-workspace-danger-soft px-4 py-3 text-[13px] leading-6 text-workspace-danger"
          >
            {workspaceError}{" "}
            <button
              type="button"
              className="underline"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        )}
        {isEmptyChat ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
            <EmptyChat onExampleClick={(q) => setQuery(q)} />
            <div className="mt-8 w-full">
              <FileUpload
                query={query}
                setQuery={setQuery}
                isSending={isSending}
                isUploading={isUploading}
                onSend={handleSendMessage}
                onFileChange={handleFileChange}
                onFilesSelected={handleFilesSelected}
              />
            </div>
          </div>
        ) : (
          <>
            <ChatPanel
              messages={activeSession?.messages ?? []}
              updateMessage={updateMessage}
              executeQuery={executeQuery}
              onExportError={(message) => showToast("error", message, "Export failed")}
            />

            <div className="fixed bottom-0 left-0 right-0 z-20 md:left-[220px]">
              <div className="pointer-events-none h-16 bg-gradient-to-b from-transparent to-workspace-surface" />
              <div className="border-t-2 border-workspace-accent/25 bg-workspace-surface px-6 pb-4 pt-3">
                <FileUpload
                  query={query}
                  setQuery={setQuery}
                  isSending={isSending}
                  isUploading={isUploading}
                  onSend={handleSendMessage}
                  onFileChange={handleFileChange}
                  onFilesSelected={handleFilesSelected}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
