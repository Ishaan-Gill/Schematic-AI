"use client"

import React, { useEffect, useEffectEvent, useRef, useState } from "react"

import { runQuery } from "@/lib/sql/runQuery"
import { generateSQL } from "@/lib/sql/generateSQL"
import { handleFile } from "@/lib/upload/uploadDataset"
import { getRelationshipsMemory } from "@/lib/ai/relationshipsMap"
import { motion } from "framer-motion"
import { ArrowUp, Paperclip, Sparkles } from "lucide-react"

export default function FileUpload({
    setTables,
    query,
    setQuery,
    error,
    setError,
    generatedSQL,
    setGeneratedSQL,
    loading,
    setLoading,
    setQueryResult,
    page,
    setPage,
    setHasMore
}: {
    setTables: React.Dispatch<React.SetStateAction<string[]>>
    query: string
    setQuery: React.Dispatch<React.SetStateAction<string>>
    error: string | null
    setError: (val: string | null) => void
    generatedSQL: string
    setGeneratedSQL: React.Dispatch<React.SetStateAction<string>>
    loading: boolean
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
    setQueryResult: React.Dispatch<React.SetStateAction<Record<string, unknown>[]>>
    page: number
    setPage: React.Dispatch<React.SetStateAction<number>>
    setHasMore: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const [schemas, setSchemas] = useState<Record<string, Record<string, unknown>[]>>({})
    const [lastSQL, setLastSQL] = useState("")
    const PAGE_SIZE = 100
    const isMountedRef = useRef(true)
    const schemaControllerRef = useRef<AbortController | null>(null)
    const queryControllerRef = useRef<AbortController | null>(null)
    const uploadControllerRef = useRef<AbortController | null>(null)
    const generateControllerRef = useRef<AbortController | null>(null)

    const isControllerActive = (controller: AbortController) =>
        isMountedRef.current && !controller.signal.aborted

    const startController = (ref: React.MutableRefObject<AbortController | null>) => {
        ref.current?.abort()
        const controller = new AbortController()
        ref.current = controller
        return controller
    }
    const fixAttemptsRef = useRef(0)

    const executeQuery = async (overrideQuery?: string) => {
        const controller = startController(queryControllerRef)
        fixAttemptsRef.current = 0

        await runQuery({
            generatedSQL: generatedSQL?.trim() || "",
            query,
            schemas,
            setError,
            setGeneratedSQL,
            setQueryResult,
            relationships: getRelationshipsMemory(),
            page,
            PAGE_SIZE,
            signal: controller.signal,
            guard: () => isControllerActive(controller),
            setHasMore,
            fixAttemptsRef
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
        if (!generatedSQL) return
        void runQueryForPagination(generatedSQL)
    }, [generatedSQL, page])

    // Function for uploading file:
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const controller = startController(uploadControllerRef)

        setGeneratedSQL("")
        setLastSQL("")
        setQueryResult([])
        setPage(0)

        await handleFile(e, {
            setTables,
            setError,
            setQuery,
            setGeneratedSQL,
            setSchemas,
            signal: controller.signal,
            guard: () => isControllerActive(controller)
        })
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-6 pb-6 pt-10 md:left-[220px]">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#0a0b0e] via-[#0a0b0e] to-transparent" />
            <div className="mx-auto max-w-[860px]">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-end gap-3 rounded-[12px] border border-[#1c1e24] bg-[#111215] px-4 py-3 transition-all duration-200 focus-within:border-[rgba(79,255,176,0.4)] focus-within:shadow-[0_0_0_3px_rgba(79,255,176,0.06)]"
                >
                    <label className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[7px] text-[#6b7280] transition-colors duration-150 hover:text-[#e8eaf0]">
                        <Paperclip className="h-[18px] w-[18px]" aria-hidden="true" />
                        <input
                            type="file"
                            multiple
                            accept=".csv,.xlsx"
                            onChange={handleFileChange}
                            className="sr-only"
                        />
                    </label>

                    <textarea
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            if (error) setError(null)
                        }}
                        placeholder="Ask anything about your business data..."
                        className="min-h-6 max-h-[120px] flex-1 resize-none border-0 bg-transparent py-1 font-sans text-[14px] leading-6 text-[#e8eaf0] placeholder:text-[#374151] focus:outline-none"
                    />

                    <motion.button
                        type="button"
                        onClick={() => {
                            const controller = startController(generateControllerRef)
                            setPage(0)
                            return void generateSQL({
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
                        disabled={loading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-[#4fffb0] text-[#0a0b0e] transition-all duration-150 hover:bg-[#3de89f] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {loading ? <Sparkles className="size-4 animate-pulse" aria-hidden="true" /> : <ArrowUp className="size-4" aria-hidden="true" />}
                    </motion.button>
                </motion.div>
            </div>
        </div>
    )
}
