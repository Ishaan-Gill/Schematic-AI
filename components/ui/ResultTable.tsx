"use client"

import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"
import ActionRow from "./ActionRow"

type ResultTableProps = {
    rows: Record<string, unknown>[]
    page: number
    hasMore: boolean
    onPrevPage: () => void
    onNextPage: () => void
    onExport: () => Promise<void>
}

export default function ResultTable({
    rows,
    page,
    hasMore,
    onNextPage,
    onPrevPage,
    onExport
}: ResultTableProps) {

    if (!rows.length) {
        return null;
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
        return /(revenue|sales|amount|price|cost|profit|margin|value|total|spend|budget|income|expense|aov|arpu|count|orders|quantity)/i.test(header)
    }

    // Find the first headline answer: first numeric value from a financial column in the first row
    let headlineValue: string | null = null
    let headlineLabel: string | null = null
    const firstRow = rows[0]
    if (firstRow) {
        for (const header of headers) {
            const val = firstRow[header]
            if (isNumeric(val) && isFinancialColumn(header)) {
                headlineValue = formatValue(val)
                headlineLabel = header
                break
            }
        }
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

            {/* Headline answer */}
            {headlineValue && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-5 flex items-baseline gap-3"
                >
                    <span
                        className="font-mono text-[2.5rem] font-bold leading-none tracking-[-0.04em]"
                        style={{ color: "var(--green)" }}
                    >
                        {headlineValue}
                    </span>
                    <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
                        {headlineLabel}
                    </span>
                </motion.div>
            )}

            {/* Header */}
            <div className="mb-4 space-y-3">

                {/* Row 1: row count + export */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span
                            className="inline-flex h-5 items-center rounded-full px-2.5 font-mono text-[10px] font-semibold"
                            style={{ background: "rgba(21,115,71,0.1)", border: "1px solid rgba(21,115,71,0.2)", color: "var(--green)" }}
                        >
                            {rows.length} rows
                        </span>
                        <span className="font-mono text-[11px]" style={{ color: "var(--ink-faint)" }}>
                            returned
                        </span>
                    </div>
                    <ActionRow onExport={onExport} />
                </div>

                {/* Row 2: pagination centered */}
                <div className="flex items-center justify-center gap-3">
                    <motion.button
                        type="button"
                        disabled={page === 0}
                        onClick={onPrevPage}
                        whileTap={{ scale: 0.96 }}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-workspace-border-strong bg-workspace-surface-raised px-3 font-mono text-[11px] text-workspace-text-secondary shadow-[1px_1px_0_rgba(23,32,26,0.06)] transition-all duration-150 hover:border-workspace-accent/30 hover:bg-workspace-accent-soft/30 hover:text-workspace-accent disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ArrowLeft className="size-4 shrink-0"/>
                        Previous
                    </motion.button>

                    <span className="flex h-8 items-center rounded-lg border border-workspace-border-strong bg-workspace-surface-sunken px-4 font-mono text-[11px] font-medium text-workspace-text">
                        Page {page + 1}
                    </span>

                    <motion.button
                        type="button"
                        disabled={!hasMore}
                        onClick={onNextPage}
                        whileTap={{ scale: 0.96 }}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-workspace-border-strong bg-workspace-surface-raised px-3 font-mono text-[11px] text-workspace-text-secondary shadow-[1px_1px_0_rgba(23,32,26,0.06)] transition-all duration-150 hover:border-workspace-accent/30 hover:bg-workspace-accent-soft/30 hover:text-workspace-accent disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                        <ArrowRight className="size-4 shrink-0"/>
                    </motion.button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border-2 border-workspace-border-strong bg-workspace-surface-raised shadow-[3px_3px_0_rgba(23,32,26,0.10)]">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-workspace-surface-sunken border-b-2 border-workspace-border-strong">
                            {headers.map((header, i) => (
                                <th
                                    key={i}
                                    className="px-4 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-workspace-text border-r border-workspace-border last:border-r-0"
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
                                className="border-b border-workspace-border/60 transition-colors duration-150 last:border-b-0"
                                style={{ ["--tw-bg-opacity" as string]: undefined }}
                            >
                                {Object.entries(row).map(([header, cell], cellIndex) => {
                                    const isFinCol = isFinancialColumn(header)
                                    const isNum = isNumeric(cell)
                                    let cellStyle: React.CSSProperties = { fontSize: "13px" }
                                    if (isNum && isFinCol) {
                                        cellStyle = { ...cellStyle, fontFamily: "var(--font-dm-mono), 'DM Mono', monospace", fontWeight: 600, color: "var(--green)" }
                                    } else if (isNum) {
                                        cellStyle = { ...cellStyle, fontFamily: "var(--font-dm-mono), 'DM Mono', monospace", color: "var(--ink)" }
                                    } else {
                                        cellStyle = { ...cellStyle, color: "var(--ink-soft)" }
                                    }
                                    return (
                                        <td
                                            key={cellIndex}
                                            className="px-4 py-2.5 border-r border-workspace-border/40 last:border-r-0"
                                            style={cellStyle}
                                        >
                                            {formatValue(cell)}
                                        </td>
                                    )
                                })}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    )
}
