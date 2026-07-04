"use client"

import { motion } from "framer-motion"
import {
  FileSpreadsheet,
  Plus,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { datasetMemory } from "@/lib/upload/metadata/datasetMemory"
import { Relationship } from "@/lib/ai/context/relationships"
import { Session } from "@/app/page"

type SidebarProps = {
  tables: string[]
  relationships: Relationship[]
  sessions: Session[]
  activeSessionId: string | null
  setActiveSessionId: React.Dispatch<React.SetStateAction<string | null>>
  handleNewChat: () => void
}

export default function Sidebar({
  tables,
  relationships,
  sessions,
  activeSessionId,
  setActiveSessionId,
  handleNewChat
}: SidebarProps) {

  const warningsCount = Object.values(datasetMemory).reduce(
    (total, dataset) =>
      total +
      Object.values(dataset.profile).filter(
        col => col.nullPercentage >= 25
      ).length,
    0
  )

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[220px] flex-col border-r border-[#1c1e24] bg-[#0a0b0e]">

      {/* Logo */}
      <motion.div
        className="flex items-center gap-2.5 px-5 py-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="grid h-7 w-7 grid-cols-2 grid-rows-2 gap-1 rounded-[6px] border-[1.5px] border-[#4fffb0] p-1">
          <div className="rounded-[2px] bg-[#4fffb0]" />
          <div className="rounded-[2px] bg-[#4fffb0]/60" />
          <div className="rounded-[2px] bg-[#4fffb0]/40" />
          <div className="rounded-[2px] bg-[#4fffb0]/20" />
        </div>

        <span className="font-sans text-[15px] font-medium text-[#e8eaf0]">
          Schematic<span className="text-[#4fffb0]">.ai</span>
        </span>
      </motion.div>

      {/* New Chat Button */}
      <motion.div
        className="px-3 pt-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <button
          onClick={handleNewChat}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg",
            "border border-[#2a2d35]",
            "bg-[#111215]",
            "px-3 py-2.5",
            "font-sans text-[13px] font-medium text-[#e8eaf0]",
            "transition-all duration-200",
            "hover:border-[#4fffb0]",
            "hover:bg-[#15171c]"
          )}
        >
          <Plus className="h-4 w-4 text-[#4fffb0]" />
          <span>New Chat</span>
        </button>
      </motion.div>

      {/* Recents Label */}
      <motion.div
        className="px-5 pt-6 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <span className="section-label">Recent</span>
      </motion.div>

      {/* Recents List */}
      <div className="space-y-1 px-2">
        {sessions.map(session => (
          <button
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            className={cn(
              "flex w-full rounded-lg px-3 py-2",
              "text-left text-[13px]",
              "transition-colors",
              activeSessionId === session.id
                ? "bg-[#1b1d22] text-white"
                : "text-[#b6bcc8] hover:bg-[#111215]"
            )}
          >
            <span className="truncate">
              {session.title}
            </span>
          </button>
        ))}
      </div>

      {/* Datasets Label */}
      <motion.div
        className="px-5 pt-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <span className="section-label">Datasets</span>
      </motion.div>

      {/* Dataset List */}
      <div className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-2">

        {tables.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-3 rounded-[6px] border border-dashed border-[#2a2d35] bg-transparent p-4 font-sans text-[12px] leading-5 text-[#6b7280]"
          >
            Uploaded datasets will appear here.
          </motion.div>
        ) : (
          tables.map((table, i) => (
            <motion.div
              key={table}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: i * 0.03
              }}
            >
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-[6px] px-3 py-2",
                  "font-mono text-[11px] text-[#e8eaf0]",
                  "transition-colors duration-150",
                  "hover:bg-[#111215]"
                )}
              >
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-[#6b7280]" />

                <span className="min-w-0 flex-1 truncate text-left">
                  {table}
                </span>
              </button>
            </motion.div>
          ))
        )}

        {/* Add dataset placeholder */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: Math.min(tables.length * 0.03, 0.2)
          }}
          className={cn(
            "mt-3 flex w-full items-center gap-2 rounded-[6px] px-3 py-2",
            "border border-dashed border-[#2a2d35]",
            "font-mono text-[10px] text-[#6b7280]",
            "transition-all duration-200",
            "hover:border-[#4fffb0] hover:bg-[rgba(79,255,176,0.02)] hover:text-[#4fffb0]"
          )}
        >
          <Plus className="h-3.5 w-3.5" />

          <span>
            Add dataset
          </span>
        </motion.button>
      </div>

      {/* Footer */}
      <motion.div
        className="border-t border-[#1c1e24]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col gap-1 px-3 py-2 font-mono text-[9px] text-[#374151]">
          <span className="flex items-center gap-1">
            <span className="h-[5px] w-[5px] rounded-full bg-[#4fffb0]" />
            {tables.length} datasets
          </span>
          <span className="flex items-center gap-1">
            <span className="h-[5px] w-[5px] rounded-full bg-[#38bdf8]" />
            {relationships.length} joins
          </span>
          <span className="flex items-center gap-1">
            <span className="h-[5px] w-[5px] rounded-full bg-[#f59e0b]" />
            {warningsCount} warnings
          </span>
        </div>

        <div className="border-t border-[#1c1e24] px-3 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(79,255,176,0.2)] bg-[rgba(79,255,176,0.1)] font-sans text-[12px] font-medium text-[#4fffb0]">
            A
          </div>
        </div>
      </motion.div>
    </aside>
  )
}
