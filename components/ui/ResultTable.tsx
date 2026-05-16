"use client"

import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, BarChart3, Rows3 } from "lucide-react"
import type React from "react"

type ResultTableProps = {
    rows: Record<string, unknown>[]
    page: number
    setPage: React.Dispatch<React.SetStateAction<number>>
}

export default function ResultTable({
    rows,
    page,
    setPage
}: ResultTableProps) {

    if (!rows.length) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden border border-dashed border-white/[0.09] bg-white/[0.025] p-8 text-sm text-zinc-500 backdrop-blur"
            >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.08),transparent_24rem)]" />
                <div className="relative flex items-center gap-3">
                    <BarChart3 className="size-5 text-cyan-300/70" aria-hidden="true" />
                    Results will render here as an analyst terminal after a query runs.
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 150, damping: 24 }}
            className="relative overflow-hidden border border-white/[0.09] bg-[#050607]/90 shadow-[0_34px_120px_rgba(0,0,0,0.48)] backdrop-blur-xl"
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.10),transparent_28rem)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/45 to-transparent" />

            <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-4">
                <div>
                    <p className="mb-1 flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.22em] text-cyan-200/75">
                        <Rows3 className="size-3.5" aria-hidden="true" />
                        Analyst Terminal
                    </p>
                    <h3 className="text-lg font-semibold tracking-tight text-zinc-50">
                        Query results
                    </h3>
                    <p className="mt-1 font-mono text-xs text-zinc-500">
                        {rows.length} rows returned
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button
                        type="button"
                        onClick={() => setPage((value) => Math.max(0, value - 1))}
                        disabled={page === 0}
                        whileHover={{ x: page === 0 ? 0 : -2 }}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-2 border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-cyan-200/25 hover:bg-cyan-300/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                        <ArrowLeft className="size-3.5" aria-hidden="true" />
                        Prev
                    </motion.button>
                    <span className="border border-white/[0.07] bg-black/30 px-3 py-2 font-mono text-xs text-cyan-100/80">
                        Page {page + 1}
                    </span>
                    <motion.button
                        type="button"
                        onClick={() => setPage((value) => value + 1)}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-2 border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-cyan-200/25 hover:bg-cyan-300/[0.06]"
                    >
                        Next
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                    </motion.button>
                </div>
            </div>

            <div className="relative max-h-[460px] overflow-auto [scrollbar-color:rgba(34,211,238,0.35)_rgba(255,255,255,0.04)] [scrollbar-width:thin]">
                <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-[#080b0d]/95 backdrop-blur">
                        <tr>
                            {Object.keys(rows[0]).map((header, index) => (
                                <th
                                    key={`${header || "column"}-${index}`}
                                    className="border-b border-white/[0.08] px-4 py-3 text-left font-mono text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-zinc-400"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <motion.tr
                                key={rowIndex}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(rowIndex * 0.012, 0.16) }}
                                className="group border-b border-white/[0.045] transition duration-300 hover:bg-cyan-300/[0.045] hover:shadow-[inset_2px_0_0_rgba(34,211,238,0.55)]"
                            >
                                {Object.values(row).map((value, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className={`whitespace-nowrap px-4 py-3 text-zinc-300 transition group-hover:text-zinc-50 ${
                                            typeof value === "number" || typeof value === "bigint"
                                                ? "font-mono tabular-nums text-cyan-50/90"
                                                : "text-zinc-300"
                                        }`}
                                    >
                                        {typeof value === "bigint"
                                            ? value.toString()
                                            : String(value)}
                                    </td>
                                ))}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    )
}
