import React from "react"

import { getDuckDB } from "@/lib/duckdb"
import { supabase } from "@/lib/supabase"
import { loadSchema } from "@/lib/sql/loadSchema"

type UploadCSVArgs = {
    files: FileList | File[]
    setTables: React.Dispatch<React.SetStateAction<string[]>>
    setSelectedTable: React.Dispatch<React.SetStateAction<string | null>>
    setSchemas: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
    setSchema?: React.Dispatch<React.SetStateAction<any[]>>
}

const normalizeTableName = (fileName: string) =>
    fileName.replace(/\.csv$/i, "").replace(/[^a-zA-Z0-9]/g, "_")

export const uploadCSV = async ({
    files,
    setTables,
    setSelectedTable,
    setSchemas,
    setSchema
}: UploadCSVArgs) => {
    for (const file of Array.from(files)) {
        const filePath = `private/${Date.now()}-${file.name}`

        const { error } = await supabase.storage.from("csv-files").upload(filePath, file)
        if (error) {
            console.error("Upload error:", error)
            continue
        }

        const { data, error: signedError } = await supabase.storage
            .from("csv-files")
            .createSignedUrl(filePath, 60)

        if (signedError || !data?.signedUrl) {
            console.error("Signed URL error:", signedError)
            continue
        }

        const db = await getDuckDB()
        const conn = await db.connect()

        try {
            const tableName = normalizeTableName(file.name)
            const response = await fetch(data.signedUrl)
            const csvText = await response.text()
            const tempName = `${tableName}.csv`

            await db.registerFileText(tempName, csvText)
            await conn.query(`
                CREATE TABLE ${tableName} AS
                SELECT * FROM read_csv_auto('${tempName}')
            `)

            setTables(prev => (prev.includes(tableName) ? prev : [...prev, tableName]))
            setSelectedTable(prev => prev ?? tableName)
            await loadSchema({ table: tableName, setSchemas, setSchema })
        } catch (err) {
            console.error("CREATE TABLE failed", err)
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
    if (!files) return

    await uploadCSV({ files, ...args })
}

export const handleFile = handleFileUpload