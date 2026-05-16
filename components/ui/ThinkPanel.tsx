"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, Loader2, ScanLine, TerminalSquare } from "lucide-react"
import { useState } from "react"

type ThinkPanelProps = {
    loading: boolean
    generatedSQL: string
}

export default function ThinkPanel({
    loading,
    generatedSQL
}: ThinkPanelProps) {
    const [open, setOpen] = useState(false)

    if (!loading && !generatedSQL) return null

    const highlightedSQL = generatedSQL.split(/(\s+|SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|JOIN|LEFT|RIGHT|INNER|OUTER|ON|WITH|AS|AND|OR|COUNT|SUM|AVG|MIN|MAX)/gi)

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 170, damping: 24 }}
            className="relative overflow-hidden border border-cyan-200/[0.10] bg-black/35 text-zinc-100 shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.08),transparent_35%,rgba(255,255,255,0.025))]" />
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="relative flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
                <span className="flex items-center gap-3 text-sm font-medium text-zinc-100">
                    {loading ? (
                        <span className="relative flex size-8 items-center justify-center border border-cyan-200/20 bg-cyan-300/[0.06]">
                            <motion.span
                                animate={{ opacity: [0.25, 1, 0.25], scale: [0.9, 1.08, 0.9] }}
                                transition={{ repeat: Infinity, duration: 1.6 }}
                                className="absolute inset-0 bg-cyan-300/10"
                            />
                            <Loader2 className="relative size-4 animate-spin text-cyan-200" aria-hidden="true" />
                        </span>
                    ) : (
                        <span className="flex size-8 items-center justify-center border border-cyan-200/20 bg-cyan-300/[0.06]">
                            <TerminalSquare className="size-4 text-cyan-200" aria-hidden="true" />
                        </span>
                    )}
                    <span>
                        <span className="block">AI reasoning trace</span>
                        <span className="mt-0.5 block font-mono text-[0.66rem] uppercase tracking-[0.2em] text-zinc-500">
                            {loading ? "Inspecting data live" : "Generated SQL available"}
                        </span>
                    </span>
                </span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
                    <ChevronDown className="size-4 text-zinc-500" aria-hidden="true" />
                </motion.span>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 210, damping: 26 }}
                        className="relative overflow-hidden border-t border-white/[0.08]"
                    >
                        <div className="px-5 py-4">
                            {loading ? (
                                <div className="space-y-3 text-sm text-zinc-400">
                                    {["Profiling schema density", "Mapping likely table relationships", "Composing executable SQL"].map((item, index) => (
                                        <motion.div
                                            key={`${item}-${index}`}
                                            initial={{ opacity: 0.35, x: -4 }}
                                            animate={{ opacity: [0.35, 1, 0.35], x: 0 }}
                                            transition={{ repeat: Infinity, duration: 1.7, delay: index * 0.18 }}
                                            className="flex items-center gap-3"
                                        >
                                            <ScanLine className="size-4 text-cyan-300/80" aria-hidden="true" />
                                            {item}
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <pre className="max-h-64 overflow-auto border border-white/[0.07] bg-[#030506]/80 p-4 font-mono text-xs leading-6 text-zinc-300 shadow-inner shadow-black/40">
                                    {highlightedSQL.map((part, index) => {
                                        const keyword = /^(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|JOIN|LEFT|RIGHT|INNER|OUTER|ON|WITH|AS|AND|OR)$/i.test(part)
                                        const fn = /^(COUNT|SUM|AVG|MIN|MAX)$/i.test(part)

                                        return (
                                            <span
                                                key={`${part}-${index}`}
                                                className={keyword ? "text-cyan-200" : fn ? "text-emerald-300" : "text-zinc-300"}
                                            >
                                                {part}
                                            </span>
                                        )
                                    })}
                                </pre>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
