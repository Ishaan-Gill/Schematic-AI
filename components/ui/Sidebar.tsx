"use client"

import { motion } from "framer-motion"
import { Database, FileSpreadsheet, PanelLeft } from "lucide-react"

type SidebarProps = {
  tables: string[]
}

export default function Sidebar({
  tables
}: SidebarProps) {
  return (
    <aside className="relative flex h-full w-full flex-col overflow-hidden border-b border-white/[0.08] bg-[#050607]/95 md:w-[292px] md:border-b-0 md:border-r">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.12),transparent_28rem)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-300/30 to-transparent" />

      <div className="relative flex items-center gap-3 border-b border-white/[0.08] px-5 py-5">
        <motion.div
          whileHover={{ scale: 1.04, rotate: -2 }}
          className="flex size-10 items-center justify-center border border-white/10 bg-white/[0.04] shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur"
        >
          <PanelLeft className="size-4 text-zinc-300" aria-hidden="true" />
        </motion.div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-50">
            Multi-Table Analyst
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Financial intelligence layer
          </p>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-zinc-500">
            <Database className="size-3.5" aria-hidden="true" />
            Datasets
          </div>
          <span className="border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-cyan-200/80">
            {tables.length}
          </span>
        </div>

        {tables.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-500 backdrop-blur"
          >
            Uploaded market, revenue, and operating datasets will appear here.
          </motion.div>
        ) : (
          <div className="space-y-2.5">
            {tables.map((table) => {
              return (
                <motion.div
                  key={table}
                  whileHover={{ x: 4, scale: 1.012 }}
                  transition={{ type: "spring", stiffness: 360, damping: 28 }}
                  className="
                    group relative flex w-full items-center gap-3 overflow-hidden
                    border border-white/[0.07]
                    bg-white/[0.025]
                    px-3 py-3 text-left text-sm text-zinc-300
                    hover:border-white/15 hover:bg-white/[0.045]
                  "
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-cyan-300/[0.10] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <FileSpreadsheet
                    className="relative size-4 shrink-0 text-zinc-500"
                    aria-hidden="true"
                  />

                  <span className="relative min-w-0 flex-1 truncate">
                    {table}
                  </span>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
