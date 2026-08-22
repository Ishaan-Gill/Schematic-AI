export interface Relationship {
    fromTable: string
    fromColumn: string
    toTable: string
    toColumn: string
}

export interface SchemaColumn {
    column_name?: unknown
    column_type?: unknown
}

export type TableSchemas = Record<string, SchemaColumn[]>

export const formatRelationship = (relationship: Relationship): string =>
    `${relationship.fromTable}.${relationship.fromColumn} = ${relationship.toTable}.${relationship.toColumn}`

const getColumnNames = (columns: SchemaColumn[]) =>
    columns
        .map((column) => column.column_name)
        .filter((columnName): columnName is string => typeof columnName === "string")
        .map((columnName) => columnName.toLowerCase())

export const detectRelationships = (schemas: TableSchemas): Relationship[] => {
    const relations: Relationship[] = []
    const tableNames = Object.keys(schemas)

    for (let i = 0; i < tableNames.length; i++) {
        for (let j = i + 1; j < tableNames.length; j++) {
            const tableA = tableNames[i]
            const tableB = tableNames[j]
            const colsA = getColumnNames(schemas[tableA])
            const colsB = getColumnNames(schemas[tableB])

            // Layer 1: exact cross-match (orders.customer_id = customers.customer_id)
            for (const colA of colsA) {
                if (colA === "id") continue
                if (colsB.includes(colA) && (
                    colA.endsWith("_id") || colA.endsWith("_code") || colA.endsWith("_no")
                )) {
                    relations.push({ fromTable: tableA, fromColumn: colA, toTable: tableB, toColumn: colA })
                }
            }

            // Layer 2: singular FK pattern (customer_id -> customers.id)
            const singular = (t: string) => t.endsWith("s") ? t.slice(0, -1) : t
            const fkAtoB = `${singular(tableB)}_id`
            const fkBtoA = `${singular(tableA)}_id`

            if (colsA.includes(fkAtoB) && colsB.includes("id")) {
                relations.push({ fromTable: tableA, fromColumn: fkAtoB, toTable: tableB, toColumn: "id" })
            }
            if (colsB.includes(fkBtoA) && colsA.includes("id")) {
                relations.push({ fromTable: tableB, fromColumn: fkBtoA, toTable: tableA, toColumn: "id" })
            }

            // Layer 3: value overlap detection (sample first 100 values)
            // Flag columns with same name that aren't _id for manual review
            // NOT IN BETA
        }
    }

    // Deduplicate
    return relations.filter((r, i, arr) =>
        arr.findIndex(x =>
            x.fromTable === r.fromTable && x.fromColumn === r.fromColumn &&
            x.toTable === r.toTable && x.toColumn === r.toColumn
        ) === i
    )
}