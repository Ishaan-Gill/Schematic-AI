import React from "react"

import { getDuckDB } from "@/lib/duckdb"

type LoadSchemaArgs = {
    table: string
    setSchemas: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
    setSchema?: React.Dispatch<React.SetStateAction<any[]>>
}

export const loadSchema = async ({ table, setSchemas, setSchema }: LoadSchemaArgs) => {
    const db = await getDuckDB()
    const conn = await db.connect()

    try {
        const result = await conn.query(`DESCRIBE ${table}`)
        const schemaData = result.toArray().map((row: any) => ({ ...row }))
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
