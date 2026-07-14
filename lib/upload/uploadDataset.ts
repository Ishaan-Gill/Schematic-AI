import React from "react"

import { getDuckDB } from "@/lib/duckdb/duckdb"
import { ingestParsedTable } from "@/lib/upload/ingestion/ingestParsedTable"
import { updateDetectedRelationships } from "./metadata/detectRelationships"
import { processFile } from "./handlers/processFile"
import { quoteIdentifier } from "../utils/quoteIdentifier"
import type { StoredDataset } from "@/types/datasets"
import { ToastItem } from "@/types/toast"

type UploadCSVArgs = {
    files: FileList | File[]
    setDatasets: React.Dispatch<React.SetStateAction<StoredDataset[]>>
    setSchemas: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
    setQuery?: React.Dispatch<React.SetStateAction<string>>
    signal?: AbortSignal
    guard?: () => boolean
    showToast: (
        type: ToastItem["type"], 
        message: string
    ) => void
}

export const uploadDataset = async ({
    files,
    setDatasets,
    setSchemas,
    setQuery,
    signal,
    guard,
    showToast
}: UploadCSVArgs) => {
    const isActive = () => !signal?.aborted && (guard?.() ?? true)

    setQuery?.("")

    for (const file of Array.from(files)) {
        if (!isActive()) return

        let conn: any = null
        try {
            const db = await getDuckDB()
            conn = await db.connect()

            const parsedTables = await processFile(file)

            // Local accumulator
            const nextSchemas: Record<string, any[]> = {}

            for (const parsedTable of parsedTables) {
                const ingested = await ingestParsedTable({
                    parsedTable,
                    db,
                    conn,
                    isActive,
                })

                if (!ingested || !isActive()) return

                const { tableName, dataset } = ingested

                setDatasets((prev) =>
                    prev.some((d) => d.table_name === tableName)
                        ? prev
                        : [...prev, dataset]
                )

                const schemaResult = await conn.query(`
                    DESCRIBE ${quoteIdentifier(tableName)}
                `)
                nextSchemas[tableName] = schemaResult.toArray()
            }
            // Single atomic schema update
            setSchemas((prev) => {
                const merged = {
                    ...prev,
                    ...nextSchemas
                }
                updateDetectedRelationships(merged)
                return merged
            })
        } catch (error) {
            if (signal?.aborted) return

            console.error("Upload failed:", error)

            showToast(
                "error",
                error instanceof Error
                    ? error.message
                    : `Failed to upload ${file.name}`
            )

        } finally {
            if (conn) await conn.close()
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
