import React from "react"

import { getDuckDB } from "@/lib/duckdb"
import { loadSchema } from "@/lib/sql/loadSchema"
import { ingestParsedTable } from "@/lib/upload/ingestion/ingestParsedTable"
import { updateDetectedRelationships } from "./metadata/detectRelationships"
import { processFile } from "./handlers/processFile"

type UploadCSVArgs = {
    files: FileList | File[]
    setTables: React.Dispatch<React.SetStateAction<string[]>>
    setSelectedTable: React.Dispatch<React.SetStateAction<string | null>>
    setSchemas: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
    setSchema?: React.Dispatch<React.SetStateAction<any[]>>
    setError?: (val: string | null) => void
    setQuery?: React.Dispatch<React.SetStateAction<string>>
    setGeneratedSQL?: React.Dispatch<React.SetStateAction<string>>
    signal?: AbortSignal
    guard?: () => boolean
}

export const uploadDataset = async ({
    files,
    setTables,
    setSelectedTable,
    setSchemas,
    setSchema,
    setError,
    setQuery,
    setGeneratedSQL,
    signal,
    guard,
}: UploadCSVArgs) => {
    const isActive = () => !signal?.aborted && (guard?.() ?? true)

    setError?.(null)
    setQuery?.("")
    setGeneratedSQL?.("")

    for (const file of Array.from(files)) {
        if (!isActive()) return

        const db = await getDuckDB()
        const conn = await db.connect()

        try {
            const parsedTables = await processFile(file)

            for (const parsedTable of parsedTables) {
                const ingested = await ingestParsedTable({
                    parsedTable,
                    db,
                    conn,
                    isActive,
                })
                if (!ingested || !isActive()) return

                const { tableName } = ingested
    
                setTables((prev) => (prev.includes(tableName) ? prev : [...prev, tableName]))
                setSelectedTable((prev) => prev ?? tableName)
    
                await loadSchema({
                    table: tableName,
                    setSchemas,
                    setSchema,
                    signal,
                    guard,
                })
            }

            setSchemas((prev) => {
                updateDetectedRelationships(prev)
                return prev
            })
        } catch (error) {
            if (signal?.aborted) return
            console.error("Upload failed:", error)
            setError?.(error instanceof Error ? error.message : `Failed to upload ${file.name}`)
        } finally {
            await conn.close()
        }
    }
}

export const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    args: Omit<UploadCSVArgs, "files">
) => {
    const files = e.target.files
    if (!files?.length) return

    await uploadDataset({ files, ...args })
}

export const handleFile = handleFileUpload
