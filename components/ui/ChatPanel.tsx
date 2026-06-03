"use client"

import { AnimatePresence, motion } from "framer-motion"
import ChatMessage from "@/components/ui/ChatMessages"
import ResultTable from "@/components/ui/resultTable"
import ThinkPanel from "@/components/ui/ThinkPanel"
import type React from "react"
import { exportCsv } from "@/lib/export/exportCsv"

type ChatPanelProps = {
  query: string
  generatedSQL: string
  loading: boolean
  hasResults: boolean
  error: string | null
  rows: Record<string, unknown>[]
  page: number
  hasMore: boolean
  setPage: React.Dispatch<React.SetStateAction<number>>
  queryResult: Record<string, unknown>[]
}

export default function ChatPanel({
  query,
  generatedSQL,
  loading,
  hasResults,
  error,
  rows,
  page,
  hasMore,
  setPage,
  queryResult
}: ChatPanelProps) {
  const assistantCopy = loading
    ? "I am reading the uploaded datasets, checking schema context, and preparing a SQL query."
    : generatedSQL
      ? "I generated SQL and ran it against your uploaded data. The result table is shown below."
      : "Upload datasets and ask a business question. I will automatically determine which tables are relevant and generate the SQL."
      
  return (
    <section className="flex w-full flex-1 flex-col bg-[#0a0b0e]">
      <div className="mx-auto flex w-full max-w-[1300px] flex-1 flex-col gap-6 px-6 py-6 pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={assistantCopy || "assistant-message"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <ChatMessage role="assistant" content={assistantCopy} />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {query.trim() && (
            <ChatMessage
              key="active-user-query"
              role="user"
              content={query.trim()}
            />
          )}

          {hasResults && (
            <motion.div
              key="results-synthesized-indicator"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b7280]"
            >
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mx-auto w-full max-w-[860px] space-y-6">
          <ThinkPanel
            loading={loading}
            generatedSQL={generatedSQL}
          />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[8px] border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] p-4 font-sans text-[13px] leading-6 text-[#fecaca]"
            >
              {error}
            </motion.div>
          )}

          <ResultTable
            rows={rows}
            page={page}
            hasMore={hasMore}
            setPage={setPage}
            onExport={() => exportCsv(queryResult, "schematic_export")}
          />
        </div>
      </div>
    </section>
  )
}
