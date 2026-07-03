"use client";

import { AnimatePresence, motion } from "framer-motion";
import ChatMessage from "@/components/ui/ChatMessages";
import ResultTable from "@/components/ui/resultTable";
import ThinkPanel from "@/components/ui/ThinkPanel";
import { exportCsv } from "@/lib/export/exportCsv";
import { Message } from "@/types/message";

type ChatPanelProps = {
  messages: Message[];
  hasResults: boolean;
  updateMessage: (
    id: string,
    updates: Partial<Message>,
    sessionId?: string,
  ) => void;
  executeQuery: (
    sql?: string,
    assistantMessageId?: string,
    page?: number,
    sessionId?: string,
  ) => Promise<void>;
};

export default function ChatPanel({
  messages,
  hasResults,
  updateMessage,
  executeQuery,
}: ChatPanelProps) {
  return (
    <section className="flex w-full flex-1 flex-col bg-[#0a0b0e]">
      <div className="mx-auto flex w-full max-w-[1300px] flex-1 flex-col gap-6 px-6 py-6 pb-40">
        <AnimatePresence>
          {messages.map((message) => (
              <div key={message.id} className="space-y-6">
                <ChatMessage role={message.role} content={message.content} />
                {message.role === "assistant" && (
                  <div className="mx-auto w-full max-w-[860px] space-y-6">
                    <ThinkPanel
                      loading={message.loading ?? false}
                      generatedSQL={message.generatedSQL ?? ""}
                    />

                    {message.error && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[8px] border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] p-4 font-sans text-[13px] leading-6 text-[#fecaca]"
                      >
                        {message.error}
                      </motion.div>
                    )}

                    <ResultTable
                      rows={message.queryResult ?? []}
                      page={message.page ?? 0}
                      hasMore={message.hasMore ?? false}
                      onPrevPage={() => {
                        const newPage = Math.max(0, (message.page ?? 0) - 1);
                        updateMessage(message.id, {
                          page: newPage,
                        });
                        void executeQuery(
                          message.generatedSQL,
                          message.id,
                          newPage,
                        );
                      }}
                      onNextPage={() => {
                        const newPage = (message.page ?? 0) + 1;
                        updateMessage(message.id, {
                          page: newPage,
                        });
                        void executeQuery(
                          message.generatedSQL,
                          message.id,
                          newPage,
                        );
                      }}
                      onExport={() =>
                        exportCsv(message.queryResult ?? [], "schematic_export")
                      }
                    />
                  </div>
                )}
              </div>
            ))}
          </AnimatePresence>

        <AnimatePresence>
          {hasResults && (
            <motion.div
              key="results-synthesized-indicator"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b7280]"
            ></motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
