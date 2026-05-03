"use client"

import { supabase } from "@/lib/supabase"
import { getDuckDB } from "@/lib/duckdb"
import React, { useEffect, useState } from "react"

export default function FileUpload({
    tables,
    setTables,
    selectedTable,
    setSelectedTable,
    query,
    setQuery
}: {
    tables: string[]
    setTables: React.Dispatch<React.SetStateAction<string[]>>
    selectedTable: string | null
    setSelectedTable: React.Dispatch<React.SetStateAction<string | null>>
    query: string
    setQuery: React.Dispatch<React.SetStateAction<string>>
}) {
    const [queryResult, setQueryResult] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)
    const [schema, setSchema] = useState<any[]>([])
    const [loading, setLoading] = useState(false)


    // Use Effects:
    useEffect(() => {
        if (selectedTable) {
            loadSchema(selectedTable)
        }
    }, [selectedTable])

    // Function for uploading file:
    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        for (const file of Array.from(files)) {
            const filePath = `private/${Date.now()}-${file.name}`

            // uploading into supabase:
            const { error } = await supabase.storage
                .from("csv-files")
                .upload(filePath, file)

            if (error) {
                console.error("Upload error:", error)
                continue
            }

            //  signedUrl generation:
            const { data, error: signedError } = await supabase.storage
                .from("csv-files")
                .createSignedUrl(filePath, 60)

            if (signedError || !data?.signedUrl) {
                console.error("Signed URL error:", signedError)
                continue
            }

            const url = data.signedUrl
            console.log("Signed URL:", url)

            //   duckDB reading csv from signedUrl:
            const db = await getDuckDB()
            const conn = await db.connect()

            try {
                console.log("creating table...")

                const tableName = file.name
                    .replace(".csv", "")
                    .replace(/[^a-zA-Z0-9]/g, "_")

                //   converts csv file to table:
                const response = await fetch(url)
                const csvText = await response.text()
                const tempName = `${tableName}.csv`
                await db.registerFileText(tempName, csvText)
                await conn.query(`
                    CREATE TABLE ${tableName} AS
                    SELECT * FROM read_csv_auto('${tempName}')
                `)

                // updates React about tables uploaded and selected:
                setTables(prev => {
                    if (prev.includes(tableName)) return prev
                    return [...prev, tableName]
                })

                //  To auto-select first table:
                setSelectedTable(prev => prev ?? tableName)

                console.log("Created table:", tableName)

            } catch (err) {
                console.error("CREATE TABLE failed", err)
            } finally {
                await conn.close()
            }
        }
    }

    // Function to run the final Query:
    const runQuery = async (overrideQuery?: string) => {
        if (!selectedTable) return

        const db = await getDuckDB()
        const conn = await db.connect()

        let finalQuery = overrideQuery
            ? overrideQuery
            : query.trim()
                ? query
                : `SELECT * FROM ${selectedTable} LIMIT 10`

        console.log("Running Query:", finalQuery)

        try {
            const result = await conn.query(finalQuery)
            console.log("Running query:", finalQuery)

            // coverts duckDB's "proxy" object into normal JS:
            const formatted = result.toArray().map(row => ({ ...row }))

            if (formatted.length === 0) {
                suggestFix(query)
            }

            console.log("Query result:", formatted)
            // triggers UI re-render:
            setQueryResult(formatted)
        } catch (err) {
            setQueryResult([])
            console.error(err)
            setError(String(err))

            await fixQueryWithAI(finalQuery, String(err))
        } finally {
            await conn.close()
        }
    }

    // Function to load schema for AI:
    const loadSchema = async (table: string) => {
        const db = await getDuckDB()
        const conn = await db.connect()

        try {
            const result = await conn.query(`DESCRIBE ${table}`)
            const schemaData = result.toArray().map(row => ({ ...row }))
            setSchema(schemaData)
        } catch (err) {
            console.error("Schema Error:", err)
        } finally {
            await conn.close()
        }
    }

    // AI
    const generateSQL = async () => {
        if (!selectedTable) return

        setLoading(true)

        const db = await getDuckDB()
        const conn = await db.connect()

        const sampleRows = await conn.query(`
        SELECT * FROM ${selectedTable} LIMIT 5    
    `)
        const sampleData = sampleRows.toArray()
        const sampleText = sampleData
            .map(row => Object.values(row).join(", "))
            .join("\n")

        try {
            const res = await fetch("/api/generate-sql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query,
                    schema,
                    selectedTable,
                    sampleText
                })
            })
            const data = await res.json()

            // To double check columns of tables (acts as final firewall)
            const validColumns = schema.map(col => col.column_name.toLowerCase())
            const isValid = validColumns.some(col =>
                data.sql.toLowerCase().includes(col)
            )
            if (!isValid) {
                setError("AI generated invalid query (unknown columns).")
                return
            }

            if (data.sql === "INVALID_QUERY") {
                setError("Cannot answer this query with availablle data.")
                return
            }

            console.log("AI SQL:", data.sql)
            setQuery(data.sql)
            runQuery(data.sql)
        } catch (err) {
            console.error("AI error:", err)
        } finally {
            setLoading(false)
            await conn.close()
        }
    }

    // to fix wrong query using AI:
    const fixQueryWithAI = async (badQuery: string, errorMsg: string) => {
        try {
            const res = await fetch("/api/fix-sql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query: badQuery,
                    error: errorMsg,
                    schema,
                    selectedTable
                })
            })
            const data = await res.json()
            console.log("FIXED SQL:", data.sql)
            setQuery(data.sql)
            runQuery(data.sql)
        } catch (err) {
            console.error("Fix Failed:", err)
        }
    }

    // function to suggest fix
    const suggestFix = async (userQuery: string) => {
        try {
            const res = await fetch("/api/suggest-fix", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query: userQuery,
                    schema,
                    selectedTable
                })
            })
            const data = await res.json()
            console.log("Suggestion:", data.suggestion)

            setError(null)
            setError(`No results found. ${data.suggestion}`)

        } catch (err) {
            console.error("Suggestion failed:", err)
        }
    }


    return (
        <div className="flex flex-col gap-6 p-4">
            <input type="file" multiple accept=".csv" onChange={handleFile} />

            {/* Buttons */}
            <div className="flex gap-4">
                <button onClick={() => runQuery()}
                    disabled={!selectedTable || loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 w-fit">
                    Run Query on {selectedTable || "..."}
                </button>
                <button onClick={() =>
                    runQuery(`SELECT * FROM ${selectedTable} LIMIT 10`)}
                    disabled={!selectedTable || loading}
                    className="bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50 w-fit">
                    Preview Table
                </button>
                <button onClick={generateSQL}
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