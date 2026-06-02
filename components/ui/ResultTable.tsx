"use client"

import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type React from "react"

type ResultTableProps = {
    rows: Record<string, unknown>[]
    page: number
    setPage: React.Dispatch<React.SetStateAction<number>>
    hasMore: boolean
}

export default function ResultTable({
    rows,
    page,
    setPage,
    hasMore
}: ResultTableProps) {

    if (!rows.length) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-[#1c1e24] bg-[#0a0b0d] p-6 text-sm text-[#6b7280]"
            >
                Results will appear here after running a query.
            </motion.div>
        )
    }

    const headers = Object.keys(rows[0] ?? {})

    const formatValue = (value: unknown) => {
        if (typeof value === "number") {
            return value.toLocaleString()
        }

        if (typeof value === "bigint") {
            return value.toString()
        }

        if (value === null || value === undefined) {
            return "-"
        }

        return String(value)
    }

    const isNumeric = (value: unknown) => {
        return (
            typeof value === "number" ||
            typeof value === "bigint"
        )
    }

    const isFinancialColumn = (header: string) => {
        return /(revenue|sales|amount|price|cost|profit|margin|value|total|spend|budget|income|expense|aov|arpu)/i.test(header)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1]
            }}
            className="w-full"
        >

            {/* Header */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="font-mono text-[11px] text-[#6b7280]">
                        {rows.length} rows returned
                    </p>
                </div>

                {/* Pagination */}
                <div className="flex items-center gap-2">
                    <motion.button
                        type="button"
                        disabled={page === 0}
                        onClick={() =>
                            setPage((prev) => Math.max(0, prev - 1))
                        }
                        whileTap={{ scale: 0.96 }}
                        className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1 font-mono text-[10px] text-[#6b7280] transition hover:bg-[rgba(79,255,176,0.06)] hover:text-[#4fffb0] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ArrowLeft className="size-3.5" />
                        Prev
                    </motion.button>

                    <span className="font-mono text-[10px] text-[#6b7280]">
                        Page {page + 1}
                    </span>

                    <motion.button
                        type="button"
                        disabled={!hasMore}
                        onClick={() => {
                            if (hasMore) {
                                setPage((prev) => prev + 1)
                            }
                        }}
                        whileTap={{ scale: 0.96 }}
                        className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1 font-mono text-[10px] text-[#6b7280] transition hover:bg-[rgba(79,255,176,0.06)] hover:text-[#4fffb0] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                        <ArrowRight className="size-3.5" />
                    </motion.button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            {headers.map((header, i) => (
                                <th
                                    key={i}
                                    className="border-b border-[#2a2d35] px-4 pb-2 text-left font-mono text-[9px] font-normal uppercase tracking-[0.1em] text-[#6b7280]"
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
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: Math.min(rowIndex * 0.04, 0.24),
                                    duration: 0.25,
                                    ease: [0.16, 1, 0.3, 1]
                                }}
                                className={cn(
                                    "border-b border-white/[0.03] transition-colors duration-150 hover:bg-[#111215]"
                                )}
                            >
                                {Object.entries(row).map(([header, cell], cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className={cn(
                                            "px-4 py-2.5 text-[13px]",
                                            isNumeric(cell) && isFinancialColumn(header)
                                                ? "font-mono text-[#4fffb0]"
                                                : isNumeric(cell)
                                                    ? "font-mono text-[#e8eaf0]"
                                                : "font-sans text-[#e5e7eb]"
                                        )}
                                    >
                                        {formatValue(cell)}
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
