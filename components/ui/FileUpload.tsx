"use client"

import React, { useEffect, useState } from "react"

import { runQuery } from "@/lib/sql/runQuery"
import { generateSQL } from "@/lib/sql/generateSQL"
import { loadSchema } from "@/lib/sql/loadSchema"
import { handleFile} from "@/lib/upload/upload.CSV"
import { detectRelationships } from "@/lib/ai/relationships"

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

    // Use Effects:
    useEffect(() => {
        if (selectedTable) {
            loadSchema({ table: selectedTable, setSchemas, setSchema })
        }
    }, [selectedTable])

    // resets memory when table is changed:
    useEffect(() => {
        setGeneratedSQL("")
        setLastSQL("")
    }, [tables])

    // Function for uploading file:
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        await handleFile(e, {
            setTables,
            setSelectedTable,
            setError,
            setQuery,
            setGeneratedSQL,
            setSchemas,
            setSchema,
        } as any)
    }
    const relationships = detectRelationships(schemas)

    return (
        <div className="flex flex-col gap-6 p-4">
            <input type="file" multiple accept=".csv" onChange={handleFileChange} />

            {/* Buttons */}
            <div className="flex gap-4">
                <button onClick={() => runQuery({
                    selectedTable,
                    generatedSQL,
                    query,
                    schema,
                    schemas,
                    setError,
                    setGeneratedSQL,
                    setQueryResult,
                    relationships
                })}
                    disabled={!selectedTable || loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 w-fit">
                    Run Query on {selectedTable || "..."}
                </button>
                <button onClick={() =>
                    runQuery({
                        selectedTable,
                        generatedSQL,
                        query,
                        schema,
                        schemas,
                        setError,
                        setGeneratedSQL,
                        setQueryResult,
                        relationships
                    }, `SELECT * FROM ${selectedTable} LIMIT 10`)}
                    disabled={!selectedTable || loading}
                    className="bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50 w-fit">
                    Preview Table
                </button>
                <button onClick={() =>
                    generateSQL({
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
                            runQuery({
                                selectedTable,
                                generatedSQL,
                                query,
                                schema,
                                schemas,
                                setError,
                                setGeneratedSQL,
                                setQueryResult,
                                relationships
                            }, sql)
                    })}
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
        </div>
    )
}
