"use client"

import React, { useEffect, useEffectEvent, useRef, useState } from "react"

import { runQuery } from "@/lib/sql/runQuery"
import { generateSQL } from "@/lib/sql/generateSQL"
import { loadSchema } from "@/lib/sql/loadSchema"
import { handleFile } from "@/lib/upload/uploadDataset"
import { updateDetectedRelationships } from "@/lib/upload/metadata/detectRelationships"

export default function FileUpload({
    tables,
    setTables,
    selectedTable,
    setSelectedTable,
    query,
    setQuery,
    error,
    setError,
    generatedSQL,
    setGeneratedSQL
}: {
    tables: string[]
    setTables: React.Dispatch<React.SetStateAction<string[]>>
    selectedTable: string | null
    setSelectedTable: React.Dispatch<React.SetStateAction<string | null>>
    query: string
    setQuery: React.Dispatch<React.SetStateAction<string>>
    error: string | null
    setError: (val: string | null) => void
    generatedSQL: string
    setGeneratedSQL: React.Dispatch<React.SetStateAction<string>>
}) {
    const [queryResult, setQueryResult] = useState<any[]>([])
    const [schema, setSchema] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [schemas, setSchemas] = useState<Record<string, any[]>>({})
    const [lastSQL, setLastSQL] = useState("")
    const [page, setPage] = useState(0)
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
            guard: () => isControllerActive(controller)
        }, overrideQuery)
    }

    const runQueryForPagination = useEffectEvent(async (overrideQuery?: string) => {
        await executeQuery(overrideQuery)
    })

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


    // Function for uploading file:
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        <div className="flex flex-col gap-6 p-4">
            <input type="file" multiple accept=".csv" onChange={handleFileChange} />

            {/* Buttons */}
            <div className="flex gap-4">
                <button onClick={() => void executeQuery()}
                    disabled={!selectedTable || loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 w-fit">
                    Run Query on {selectedTable || "..."}
                </button>
                <button onClick={() =>
                    void executeQuery(`SELECT * FROM ${selectedTable} LIMIT 10`)}
                    disabled={!selectedTable || loading}
                    className="bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50 w-fit">
                    Preview Table
                </button>
                <button onClick={() => {
                    const controller = startController(generateControllerRef)
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
                        runQuery: (sql?: string) =>
                            executeQuery(sql),
                        signal: controller.signal,
                        guard: () => isControllerActive(controller)
                    })
                }}
                    disabled={!selectedTable || loading}
                    className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50 w-fit">
                    {loading ? "Thinking..." : "Ask AI"}
                </button>
            </div>

            {/* AI Loading UI */}
            {loading && (
                <p className="text-sm text-gray-500">
                    AI is generating SQL...
                </p>
            )}

            {/* Error UI */}
            {error && (
                <p className="text-red-500 bg-red-50 p-2 rounded">
                    {error}
                </p>
            )}

            {/* Schema UI */}
            {schema.length > 0 && (
                <div className="border rounded-lg p-4 bg-gray-50">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-500 text-left border-b">
                                <th className="py-2">Column</th>
                                <th className="py-2">Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schema.map((col, i) => (
                                <tr key={i} className="border-b">
                                    <td className="py-2 font-medium">{col.column_name}</td>
                                    <td className="py-2 text-gray-500">{col.column_type}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Result UI */}
            <div>
                {queryResult.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-auto max-h-[400px]">
                            <p className="text-sm text-gray-500 mb-2">
                                {queryResult.length} rows returned
                            </p>
                            <table className="w-full text-left text-sm border-collapse">
                                {/* header */}
                                <thead className="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                        {/* Extract headers from the keys of the first row */}
                                        {Object.keys(queryResult[0]).map((headerKey) => (
                                            <th key={headerKey} className="p-3 border-b border-gray-300 font-semibold">
                                                {headerKey}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                {/* body */}
                                <tbody>
                                    {queryResult.map((row, rowIndex) => (
                                        <tr key={rowIndex} className="border-b hover:bg-gray-50">
                                            {Object.values(row).map((val, colIndex) => (
                                                <td key={colIndex} className="p-3 text-gray-700">
                                                    {typeof val === "bigint" ? val.toString() : String(val)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500 italic">Run a query to see results.</p>
                )}
            </div>

            {/* prev/next button */}
            {queryResult.length > 0 && (
                <div className="flex gap-2 mt-4">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))}>
                        Prev
                    </button>
                    <button onClick={() => setPage(p => p + 1)}>
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}
