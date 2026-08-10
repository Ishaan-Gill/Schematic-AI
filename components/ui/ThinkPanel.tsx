"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import AssistantLoading from "@/components/ui/AssistantLoading"
import DataNotes from "@/components/ui/DataNotes"
import { type LoadingStage } from "@/lib/chat/loadingStages"

type ThinkPanelProps = {
    loading: boolean
    loadingStage?: LoadingStage
    generatedSQL: string
    warnings?: string[]
    normalizationNotes?: string[]
}

export default function ThinkPanel({
    loading,
    loadingStage,
    generatedSQL,
    warnings,
    normalizationNotes
}: ThinkPanelProps) {
    const [open, setOpen] = useState(false)

    if (!loading && !generatedSQL) return null

    const highlightedSQL = generatedSQL.split(/(\s+|'(?:''|[^'])*'|"(?:\\"|[^"])*"|SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|JOIN|LEFT|RIGHT|INNER|OUTER|ON|WITH|AS|AND|OR|COUNT|SUM|AVG|MIN|MAX)/gi)

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden rounded-[8px] bg-[#0d0f12] text-[#e8eaf0]"
        >
            {generatedSQL && (
                <>
                    <button
                        type="button"
                        onClick={() => setOpen((value) => !value)}
                        className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2 text-left"
                    >
                        <span className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#38bdf8] animate-pulse-dot" />
                            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#6b7280]">
                                SQL
                            </span>
                        </span>
                        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className="size-4 text-[#6b7280]" aria-hidden="true" />
                        </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                        {open && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="grid gap-3 px-4 pb-4 pt-2 lg:grid-cols-[minmax(0,1fr)_220px]">
                                    <pre className="max-h-64 overflow-auto rounded-[8px] bg-[#0d1117] p-4 font-mono text-[11px] leading-[1.6] text-[#e8eaf0]">
                                        {highlightedSQL.map((part, index) => {
                                            const keyword = /^(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|JOIN|LEFT|RIGHT|INNER|OUTER|ON|WITH|AS|AND|OR)$/i.test(part)
                                            const fn = /^(COUNT|SUM|AVG|MIN|MAX)$/i.test(part)
                                            const quoted = /^('(?:''|[^'])*'|"(?:\\"|[^"])*")$/.test(part)

                                            return (
                                                <span
                                                    key={`${part}-${index}`}
                                                    className={keyword ? "text-[#38bdf8]" : fn || quoted ? "text-[#4fffb0]" : "text-[#e8eaf0]"}
                                                >
                                                    {part}
                                                </span>
                                            )
                                        })}
                                    </pre>

                                    <DataNotes
                                        warnings={warnings ?? []}
                                        normalizationNotes={normalizationNotes ?? []}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
            {loading && (
                <div className={generatedSQL ? "border-t border-[#1c1e24] px-4 py-2" : "px-4 py-2"}>
                    <AssistantLoading stage={loadingStage ?? "understanding"} />
                </div>
            )}
        </motion.div>
    )
}
