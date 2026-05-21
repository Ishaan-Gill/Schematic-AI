"use client"

import React, { useEffect, useEffectEvent, useRef, useState } from "react"

import { runQuery } from "@/lib/sql/runQuery"
import { generateSQL } from "@/lib/sql/generateSQL"
import { loadSchema } from "@/lib/sql/loadSchema"
import { handleFile } from "@/lib/upload/uploadDataset"
import { updateDetectedRelationships } from "@/lib/upload/metadata/detectRelationships"
import ResultTable from "@/components/ui/resultTable"
import ThinkPanel from "@/components/ui/ThinkPanel"
import { motion } from "framer-motion"
import { ArrowUp, Eye, Paperclip, Sparkles } from "lucide-react"

export default function FileUpload({
    setTables,
    selectedTable,
    setSelectedTable,
    query,
    setQuery,
    error,
    setError,
    generatedSQL,
    setGeneratedSQL,
    loading,
    setLoading
}: {
    setTables: React.Dispatch<React.SetStateAction<string[]>>
    selectedTable: string | null
    setSelectedTable: React.Dispatch<React.SetStateAction<string | null>>
    query: string
    setQuery: React.Dispatch<React.SetStateAction<string>>
    error: string | null
    setError: (val: string | null) => void
    generatedSQL: string
    setGeneratedSQL: React.Dispatch<React.SetStateAction<string>>
    loading: boolean
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const [queryResult, setQueryResult] = useState<Record<string, unknown>[]>([])
    const [schema, setSchema] = useState<Record<string, unknown>[]>([])
    const [schemas, setSchemas] = useState<Record<string, Record<string, unknown>[]>>({})
    const [lastSQL, setLastSQL] = useState("")
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const PAGE_SIZE = 100
    const isMountedRef = useRef(true)
    const schemaControllerRef = useRef<AbortController | null>(null)
    const queryControllerRef = useRef<AbortController | null>(null)
    const uploadControllerRef = useRef<AbortController | null>(null)
    const generateControllerRef = useRef<AbortController | null>(null)
    const relationships = updateDetectedRelationships(schemas)

    const isControllerActive = (controller: AbortController) =>
        isMountedRef.current && !controller.signal.aborted

    const startController = (ref: React.MutableRefObject<AbortController | null>) => {
        ref.current?.abort()
        const controller = new AbortController()
        ref.current = controller
        return controller
    }

    const executeQuery = async (overrideQuery?: string) => {
        const controller = startController(queryControllerRef)

        await runQuery({
            selectedTable,
            generatedSQL: generatedSQL?.trim() || "",
            query,
            schema,
            schemas,
            setError,
            setGeneratedSQL,
            setQueryResult,
            relationships,
            page,
            PAGE_SIZE,
            signal: controller.signal,
            guard: () => isControllerActive(controller),
            setHasMore
        }, overrideQuery)
    }

    const runQueryForPagination = useEffectEvent(async (overrideQuery?: string) => {
        await executeQuery(overrideQuery)
    })

    // useEffects: 
    useEffect(() => {
        const schemaControllers = schemaControllerRef
        const queryControllers = queryControllerRef
        const uploadControllers = uploadControllerRef
        const generateControllers = generateControllerRef

        return () => {
            isMountedRef.current = false
            schemaControllers.current?.abort()
            queryControllers.current?.abort()
            uploadControllers.current?.abort()
            generateControllers.current?.abort()
        }
    }, [])

    useEffect(() => {
        if (selectedTable) {
            const controller = startController(schemaControllerRef)
            void loadSchema({
                table: selectedTable,
                setSchemas,
                setSchema,
                signal: controller.signal,
                guard: () => isControllerActive(controller)
            })
            return () => {
                controller.abort()
            }
        }
    }, [selectedTable])

    useEffect(() => {
        if (!generatedSQL) return
        void runQueryForPagination(generatedSQL)
    }, [generatedSQL, page])

    useEffect(() => {
        setLastSQL("")
        setQueryResult([])
        setPage(0)
        setHasMore(false)
    }, [selectedTable])

    // Function for uploading file:
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {

        console.log("FILE CHANGE TRIGGERED")

        const controller = startController(uploadControllerRef)

        setGeneratedSQL("")
        setLastSQL("")
        setQueryResult([])
        setPage(0)

        await handleFile(e, {
            setTables,
            setSelectedTable,
            setError,
            setQuery,
            setGeneratedSQL,
            setSchemas,
            setSchema,
            signal: controller.signal,
            guard: () => isControllerActive(controller)
        })
    }

    return (
        <>
            <div className="mx-auto w-full max-w-6xl px-4 pb-40 sm:px-6 lg:px-10">
                <div className="space-y-5">
                    <ThinkPanel
                        loading={loading}
                        generatedSQL={generatedSQL}
                    />

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-red-400/25 bg-red-500/[0.08] p-4 text-sm text-red-100 shadow-[0_18px_60px_rgba(239,68,68,0.08)] backdrop-blur"
                        >
                            {error}
                        </motion.div>
                    )}

                    <ResultTable rows={queryResult} page={page} hasMore={hasMore} setPage={setPage} />
                </div>
            </div>

            <div className="sticky bottom-0 z-20 border-t border-white/[0.08] bg-black/55 px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-10">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/45 to-transparent" />
                <div className="mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        transition={{ type: "spring", stiffness: 170, damping: 24 }}
                        className="relative overflow-hidden border border-white/[0.10] bg-[#080b0d]/86 shadow-[0_26px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                    >
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.12),transparent_26rem)]" />
                        <textarea
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                if (error) setError(null)
                            }}
                            placeholder="Ask anything about your business data..."
                            className="relative min-h-24 w-full resize-none border-0 bg-transparent p-5 text-[0.95rem] leading-7 text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                        />

                        <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] px-4 py-3">
                            <label className="inline-flex cursor-pointer items-center gap-2 border border-white/[0.09] bg-white/[0.035] px-3.5 py-2.5 text-sm font-medium text-zinc-300 transition duration-300 hover:border-cyan-200/25 hover:bg-cyan-300/[0.06] hover:text-cyan-100">
                                <Paperclip className="size-4" aria-hidden="true" />
                                Upload
                                <input
                                    type="file"
                                    multiple
                                    accept=".csv,.xlsx"
                                    onChange={handleFileChange}
                                    className="sr-only"
                                />
                            </label>

                            <div className="flex items-center gap-2">
                                <motion.button
                                    type="button"
                                    onClick={() =>
                                        void executeQuery(`SELECT * FROM "${selectedTable}" LIMIT 10`)
                                    }
                                    disabled={!selectedTable || loading}
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="inline-flex items-center gap-2 border border-white/[0.09] bg-white/[0.035] px-3.5 py-2.5 text-sm font-medium text-zinc-300 transition duration-300 hover:border-cyan-200/25 hover:bg-cyan-300/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                    <Eye className="size-4" aria-hidden="true" />
                                    Preview
                                </motion.button>

                                <motion.button
                                    type="button"
                                    onClick={() => {
                                        const controller = startController(generateControllerRef)
                                        setPage(0)
                                        return void generateSQL({
                                            selectedTable,
                                            query,
                                            schemas,
                                            generatedSQL,
                                            lastSQL,
                                            setError,
                                            setLoading,
                                            setGeneratedSQL,
                                            setLastSQL,
                                            signal: controller.signal,
                                            guard: () => isControllerActive(controller)
                                        })
                                    }}
                                    disabled={!selectedTable || loading}
                                    whileHover={{ y: -1, boxShadow: "0 0 34px rgba(34,211,238,0.28)" }}
                                    whileTap={{ scale: 0.98 }}
                                    className="inline-flex items-center gap-2 bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition duration-300 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                    {loading ? <Sparkles className="size-4 animate-pulse" aria-hidden="true" /> : null}
                                    {loading ? "Analyzing" : "Ask"}
                                    <ArrowUp className="size-4" aria-hidden="true" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                    <p className="mt-3 text-center font-mono text-[0.68rem] uppercase tracking-[0.18em] text-zinc-600">
                        {selectedTable ? `Using ${selectedTable}` : "Upload a dataset to start"}
                    </p>
                </div>
            </div>
        </>
    )
}
