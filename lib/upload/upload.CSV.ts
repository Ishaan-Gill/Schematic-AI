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

        const MAX_FILE_SIZE = 50 * 1024 * 1024
        if (file.size > MAX_FILE_SIZE) {
            console.error("File too large")
            continue
        }

        // Uploading file into Supabase:
        const { error } = await supabase.storage.from("csv-files").upload(filePath, file)
        if (error) {
            console.error("Upload error:", error)
            continue
        }

        // SignedURL generation: 
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
            const lines = csvText.split("\n")
            const rawHeaders = lines[0].split(",")

            // Normalization loop:
            const usedNames = new Set<string>()
            const cleanedHeaders = rawHeaders.map(header => {
                let cleaned = header
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, "_")
                    .replace(/[^a-z0-9_]/g, "")

                // fallback if empty:
                if (!cleaned) {
                    cleaned = "column"
                }

                // handles duplicates:
                let finalName = cleaned
                let counter = 1

                while (usedNames.has(finalName)) {
                    finalName = `${cleaned}_${counter}`
                    counter++
                }
                usedNames.add(finalName)
                return finalName
            })

            lines[0] = cleanedHeaders.join(",")
            const cleanedCSV = lines.join("\n")

            await db.registerFileText(tempName, cleanedCSV)
            await conn.query(`
                CREATE TABLE ${tableName} AS
                SELECT * FROM read_csv_auto(
                    '${tempName}',
                    strict_mode = false,
                    ignore_errors = true,
                    null_padding = true
                )
            `)

            const columnsResult = await conn.query(`
                DESCRIBE ${tableName}
            `)
            const columns = columnsResult.toArray()

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

            // numeric coercion loop ( $ % , etc ):
            for (const col of columns) {
                if (col.column_type !== "VARCHAR") {
                    continue
                }
                const columnName = col.column_name
                const numericCheck = await conn.query(`
                    SELECT
                        COUNT(
                            CASE
                                WHEN "${columnName}" IS NOT NULL
                                THEN 1
                            END
                        ) AS total_rows,
                        COUNT(
                            TRY_CAST(
                                REPLACE(
                                    REPLACE(
                                        REPLACE("${columnName}", '$', ''),
                                    ',', ''),
                                '%', '') AS DOUBLE
                            )
                        ) AS numeric_rows

                    FROM ${tableName}
                `)

                // To check if the column atually contain numerics:
                const stats = numericCheck.toArray()[0]
                const ratio = Number(stats.numeric_rows) / Number(stats.total_rows)

                // Numeric conversion:
                if (ratio > 0.8) {
                    await conn.query(`
                        ALTER TABLE ${tableName}
                        ALTER COLUMN "${columnName}"
                        TYPE DOUBLE
                        USING TRY_CAST(
                            REPLACE(
                                REPLACE(
                                    REPLACE("${columnName}", '$', ''),
                                ',', ''),
                            '%', '') AS DOUBLE
                        )
                    `)
                }
            }

            // Date detection loop: 
            // here we use different DESCRIBE because this update one will contain numeric coercion already.
            const updatedSchemaResult = await conn.query(`
                DESCRIBE ${tableName}    
            `)
            const updatedSchemaColumns = updatedSchemaResult.toArray()

            for (const col of updatedSchemaColumns) {
                if (col.column_type !== "VARCHAR" &&
                    col.column_type !== "TEXT"
                ) {
                    continue
                }
                const columnName = col.column_name
                const dateCheck = await conn.query(`
                    SELECT
                        COUNT(*) AS total_rows,
                        COUNT(
                            COALESCE(
                                TRY_STRPTIME("${columnName}", '%Y-%m-%d'),
                                TRY_STRPTIME("${columnName}", '%m/%d/%Y'),
                                TRY_STRPTIME("${columnName}", '%B %d %Y'),
                                TRY_CAST("${columnName}" AS DATE)
                            )
                        ) AS date_rows
                    FROM ${tableName}
                `)

                // To check if column actually contain dates:
                const dateStats = dateCheck.toArray()[0]
                const dateRatio =
                    Number(dateStats.date_rows) /
                    Number(dateStats.total_rows)

                // DATE conversion:
                if (dateRatio > 0.8) {
                    await conn.query(`
                        ALTER TABLE ${tableName}
                        ALTER COLUMN "${columnName}"
                        TYPE DATE
                        USING COALESCE(
                            TRY_STRPTIME("${columnName}", '%Y-%m-%d'),
                            TRY_STRPTIME("${columnName}", '%m/%d/%Y'),
                            TRY_STRPTIME("${columnName}", '%B %d %Y'),
                            TRY_CAST("${columnName}" AS DATE)
                        )
                    `)
                }
            }

            // column profiling: 
            const profile: Record<string, any> = {}
            for (const col of columns) {
                const columnName = col.column_name
                try {
                    const stats = await conn.query(`
                        SELECT
                            COUNT(*) AS total_rows,
                            COUNT("${columnName}") AS non_null_rows,
                            COUNT(DISTINCT "${columnName}") AS unique_values
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

            const rowCountResult = await conn.query(`
                SELECT COUNT(*) AS count
                FROM ${tableName}
            `)
            const rowCount =
                Number(rowCountResult.toArray()[0].count)
            if (rowCount > 2_000_000) {
                throw new Error(
                    "Dataset too large."
                )
            }
            if (columns.length > 200) {
                throw new Error(
                    "Too many columns. Max supported: 200"
                )
            }

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