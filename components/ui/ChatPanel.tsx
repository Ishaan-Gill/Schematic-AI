"use client"

import { AnimatePresence, motion } from "framer-motion"
import { BrainCircuit, LineChart, Sparkles } from "lucide-react"
import ChatMessage from "@/components/ui/ChatMessages"

type ChatPanelProps = {
  query: string
  selectedTable: string | null
  generatedSQL: string
  loading: boolean
  hasResults: boolean
}

export default function ChatPanel({
  query,
  selectedTable,
  generatedSQL,
  loading,
  hasResults
}: ChatPanelProps) {
  const assistantCopy = loading
    ? "I am reading the selected dataset, checking schema context, and preparing a SQL query."
    : generatedSQL
      ? "I generated SQL and ran it against your uploaded data. The result table is shown below."
      : selectedTable
        ? "Ask a question about the selected dataset. I will translate it into SQL and return the answer here."
        : "Upload a dataset to begin. Once a table is selected, ask a business question in the prompt bar."

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 24 }}
        className="relative overflow-hidden border border-white/[0.08] bg-white/[0.035] p-6 shadow-[0_34px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.14),transparent_30rem)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent" />
        <div className="flex items-start justify-between gap-4">
          <div className="relative">
            <p className="flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-cyan-200/90">
              <Sparkles className="size-3.5" aria-hidden="true" />
              AI Native Financial Analyst
            </p>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              Inspect, reason, and model uploaded business data.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Built for fast questions, traceable SQL reasoning, and analyst-grade result review.
            </p>
          </div>
          <motion.div
            whileHover={{ y: -2 }}
            className="relative hidden border border-white/[0.08] bg-black/30 px-4 py-3 text-xs text-zinc-400 shadow-2xl shadow-black/20 backdrop-blur sm:block"
          >
            <div className="mb-1 flex items-center gap-2 text-cyan-200">
              <LineChart className="size-3.5" aria-hidden="true" />
              Active context
            </div>
            <div className="max-w-44 truncate font-mono text-zinc-300">
              {selectedTable || "No active table"}
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="flex flex-1 flex-col gap-4 pb-2">
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
              className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-zinc-500"
            >
              <BrainCircuit className="size-4 text-cyan-300" aria-hidden="true" />
              Results synthesized below
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
