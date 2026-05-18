import { cleanValues } from "../normalization/cleanValues"
import { inferColumnTypes } from "../normalization/inferColumnTypes"
import { normalizeHeaders } from "../normalization/normalizeHeaders"
import { validateTable } from "../validation/validateTable"
import { createDuckTable } from "./createDuckTable"
import { profileTable } from "./profileTable"

import { datasetMemory } from "../metadata/datasetMemory"

import { inferSemanticContext } from "@/lib/metadata/sematicInference"

import type { ParsedTable } from "../parsers/parseExcel"

type QueryRow = Record<string, unknown>

type DuckQueryResult = {
    toArray: () => QueryRow[]
}

type DuckConnection = {
    query: (sql: string) => Promise<DuckQueryResult>
}

type DuckDatabase = {
    registerFileText: (name: string, content: string) => Promise<void>
}

type ColumnInfo = QueryRow & {
    column_name: string
    column_type: string
}

type IngestParsedTableArgs = {
    parsedTable: ParsedTable
    db: DuckDatabase
    conn: DuckConnection
    isActive?: () => boolean
}

const escapeIdentifier = (value: string) =>
    value.replace(/"/g, "\"\"")

export const ingestParsedTable = async ({
    parsedTable,
    db,
    conn,
    isActive = () => true,
}: IngestParsedTableArgs) => {

    const tableName = parsedTable.tableName

    if (
        !parsedTable.csvText &&
        (!parsedTable.rows || !parsedTable.rows.length)
    ) {
        throw new Error(`"${tableName}" is empty.`)
    }

    const csvText = parsedTable.csvText ?? ""

    const tempName = `${tableName}.csv`

    await conn.query(`
        DROP TABLE IF EXISTS "${tableName}"
    `)

    await createDuckTable({
        db,
        conn,
        tableName,
        tempName,
        csvText,
    })

    if (!isActive()) return null

    // get parsed schema
    const parsedColumnsResult = await conn.query(`
        DESCRIBE "${tableName}"
    `)

    const parsedColumns =
        parsedColumnsResult.toArray() as ColumnInfo[]

    // clean headers after duckdb parsing:
    for (const column of parsedColumns) {
        const cleanedHeader = normalizeHeaders([column.column_name])[0]
        if (!cleanedHeader || column.column_name === cleanedHeader) {
            continue
        }
        await conn.query(`
        ALTER TABLE "${tableName}"
        RENAME COLUMN
        "${escapeIdentifier(column.column_name)}"
        TO
        "${escapeIdentifier(cleanedHeader)}"
    `)
    }

    // row count
    const rowCountResult = await conn.query(`
        SELECT COUNT(*) AS count
        FROM "${tableName}"
    `)

    const rowCount = Number(rowCountResult.toArray()[0]?.count ?? 0)

    // schema
    const columnsResult = await conn.query(`
        DESCRIBE "${tableName}"
    `)

    const columns = columnsResult.toArray() as ColumnInfo[]

    // null cleaning
    await cleanValues({
        conn,
        tableName,
        columns,
    })

    // type inference
    await inferColumnTypes(
        conn,
        tableName
    )

    // refreshed schema
    const refreshedColumnsResult =
        await conn.query(`
            DESCRIBE "${tableName}"
        `)

    const refreshedColumns = refreshedColumnsResult.toArray() as ColumnInfo[]

    // profiling
    const profile = await profileTable({
        conn,
        tableName,
        columns: refreshedColumns,
    })

    // semantic inference
    const semantic = inferSemanticContext(tableName)

    // Memory injection
    datasetMemory[tableName] = {
        schema: refreshedColumns.map((column) => ({
            column_name: column.column_name,
            column_type: String(column.column_type)
        })),
        profile,
        semantic: semantic,
        relationships: [],
        feedback: {
            successfulQueries: [],
            failedQueries: []
        }
    }

    // validation
    validateTable({
        rowCount,
        columns: refreshedColumns,
    })

    return {
        tableName,
        columns: refreshedColumns,
        profile,
    }
}