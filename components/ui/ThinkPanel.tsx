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

    const hasNotes = (warnings?.length ?? 0) > 0 || (normalizationNotes?.length ?? 0) > 0

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden rounded-xl border border-workspace-border-strong bg-workspace-surface-sunken shadow-[2px_2px_0_rgba(23,32,26,0.08)]"
        >
            {generatedSQL && (
                <>
                    <button
                        type="button"
                        onClick={() => setOpen((value) => !value)}
                        className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-workspace-accent-soft/30"
                    >
                        <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-workspace-accent-blue animate-pulse-dot" />
                            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-workspace-text-secondary">
                                How this was calculated
                            </span>
                        </span>
                        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className="size-4 text-workspace-text-muted" aria-hidden="true" />
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
                                <div className={`grid gap-3 border-t border-workspace-border px-4 pb-4 pt-3 ${hasNotes ? "lg:grid-cols-[minmax(0,1fr)_220px]" : ""}`}>
                                    <div className="rounded-lg border border-workspace-border bg-[#e6e9e2] p-4 shadow-[inset_0_2px_4px_rgba(23,32,26,0.08)]">
                                        <pre className="max-h-64 overflow-auto font-mono text-[11px] leading-[1.7] text-workspace-text">
                                            {highlightedSQL.map((part, index) => {
                                                const keyword = /^(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|JOIN|LEFT|RIGHT|INNER|OUTER|ON|WITH|AS|AND|OR)$/i.test(part)
                                                const fn = /^(COUNT|SUM|AVG|MIN|MAX)$/i.test(part)
                                                const quoted = /^('(?:''|[^'])*'|"(?:\\"|[^"])*")$/.test(part)

                                                return (
                                                    <span
                                                        key={`${part}-${index}`}
                                                        className={keyword ? "font-semibold text-blue-700" : fn || quoted ? "text-workspace-accent font-medium" : ""}
                                                    >
                                                        {part}
                                                    </span>
                                                )
                                            })}
                                        </pre>
                                    </div>

                                    {hasNotes && (
                                        <div className="rounded-lg border border-workspace-border bg-workspace-surface-raised p-3 shadow-[1px_1px_0_rgba(23,32,26,0.04)]">
                                            <DataNotes
                                                warnings={warnings ?? []}
                                                normalizationNotes={normalizationNotes ?? []}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
            {loading && (
                <div className={generatedSQL ? "border-t border-workspace-border px-4 py-3" : "px-4 py-3"}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-workspace-accent/10 border border-workspace-accent/20">
                            <div className="h-2 w-2 rounded-full bg-workspace-accent animate-pulse" />
                        </div>
                        <AssistantLoading stage={loadingStage ?? "understanding"} />
                    </div>
                </div>
            )}
        </motion.div>
    )
}
