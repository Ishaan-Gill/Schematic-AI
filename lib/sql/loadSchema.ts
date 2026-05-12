import React from "react"

import { getDuckDB } from "@/lib/duckdb"

type LoadSchemaArgs = {
    table: string
    setSchemas: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
    setSchema?: React.Dispatch<React.SetStateAction<any[]>>
    signal?: AbortSignal
    guard?: () => boolean
}

const isActive = (guard?: () => boolean, signal?: AbortSignal) =>
    !signal?.aborted && (guard?.() ?? true)

export const loadSchema = async ({
    table,
    setSchemas,
    setSchema,
    signal,
    guard
}: LoadSchemaArgs) => {
    if (!isActive(guard, signal)) return []

    const db = await getDuckDB()
    const conn = await db.connect()

    try {
        const result = await conn.query(`DESCRIBE ${table}`)
        const schemaData = result.toArray().map((row: any) => ({ ...row }))
        if (!isActive(guard, signal)) return []

        setSchemas(prev => ({ ...prev, [table]: schemaData }))
        setSchema?.(schemaData)
        return schemaData
    } catch (err) {
        console.error("Schema Error:", err)
        return []
    } finally {
        await conn.close()
    }
}
