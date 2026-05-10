import React from "react"

import { getDuckDB } from "@/lib/duckdb"
import { supabase } from "@/lib/supabase"
import { loadSchema } from "@/lib/sql/loadSchema"
import { detectRelationships } from "@/lib/ai/relationships"
import { relationshipsMemory } from "../ai/relationshipsMap"

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

            // normalization loop:
            const columnsResult = await conn.query(`
                DESCRIBE ${tableName}
            `)
            const columns = columnsResult.toArray()
            const usedNames = new Set<string>()

            for (const col of columns) {
                const original = col.column_name
                let cleaned = original
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, "_")
                    .replace(/[^a-z0-9_]/g, "")

                // fallback if empty
                if (!cleaned) {
                    cleaned = "column"
                }

                // handle duplicates
                let finalName = cleaned
                let counter = 1

                while (usedNames.has(finalName)) {
                    finalName = `${cleaned}_${counter}`
                    counter++
                }
                usedNames.add(finalName)

                if (original !== finalName) {
                    await conn.query(`
                        ALTER TABLE ${tableName}
                        RENAME COLUMN "${original}" TO ${finalName}
                    `)
                }
            }

            // NULL normalization:
            for (const col of columns) {
                const columnName = col.column_name
                await conn.query(`
                    UPDATE ${tableName}
                    SET ${columnName} = NULL
                    WHERE TRIM(LOWER(${columnName})) IN (
                        'n/a',
                        'na',
                        'null',
                        'none',
                        '-',
                        '--',
                        ''
                    )
                `).catch(() => { })
            }

            // column profiling: 
            const profile: Record<string, any> = {}
            for (const col of columns) {
                const columnName = col.column_name
                try {
                    const stats = await conn.query(`
                        SELECT
                            COUNT(*) AS total_rows,
                            COUNT(${columnName}) AS non_null_rows,
                            COUNT(DISTINCT ${columnName}) AS unique_values
                        FROM ${tableName}
                    `)
                    profile[columnName] = stats.toArray()[0]
                } catch (err) {
                    console.error("Profiling failed:", columnName)
                }
            }

            setTables(prev => (prev.includes(tableName) ? prev : [...prev, tableName]))
            setSelectedTable(prev => prev ?? tableName)
            await loadSchema({ table: tableName, setSchemas, setSchema })

            setSchemas(prev => {
                const updatedSchemas = {
                    ...prev
                }
                const detected = detectRelationships(updatedSchemas)

                relationshipsMemory.length = 0
                relationshipsMemory.push(...detected.filter((item): item is Exclude<typeof item, string> => typeof item !== 'string'))

                return prev
            })
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