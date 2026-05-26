import { inferSemanticRole } from "@/lib/metadata/inferSemanticRole"

type ColumnInfo = {
    column_name: string
    column_type: string
}

type RelevantTableScore = {
    tableName: string
    score: number
    matchedOn: string[]  // for debugging/transparency panel
}

type Relationship = {
    fromTable: string
    fromColumn: string
    toTable: string
    toColumn: string
}

export const expandRelevantTables = (
    relevantTables: string[],
    relationships: Relationship[]
): string[] => {
    const expanded = new Set(relevantTables)
    for (const rel of relationships) {
        // If one side is relevant,
        // include the connected table too
        if (expanded.has(rel.fromTable)) {
            expanded.add(rel.toTable)
        }
        if (expanded.has(rel.toTable)) {
            expanded.add(rel.fromTable)
        }
    }
    return Array.from(expanded)
}

export const detectTableRelevance = (
    query: string,
    schemas: Record<string, ColumnInfo[]>
): string[] => {
    const q = query.toLowerCase()
    const tableNames = Object.keys(schemas)

    // Edge case: only one table
    if (tableNames.length === 1) return tableNames

    const scored: RelevantTableScore[] = tableNames.map(tableName => {
        const columns = schemas[tableName]
        let score = 0
        const matchedOn: string[] = []

        // Tier 1: Table name match (strongest signal)
        const queryTokens = q.split(/[\s_\-,.()\[\]]+/).filter(Boolean)
        const tableTokens = tableName.toLowerCase().split(/[\s_]+/).filter(Boolean)
        const hasTableMatch = tableTokens.some(token =>
            queryTokens.some(qt =>
                qt === token ||
                qt.startsWith(token) ||
                token.startsWith(qt)
            )
        )
        if (hasTableMatch) {
            score += 5
            matchedOn.push(`table name: ${tableName}`)
        }

        // Tier 2: Column name match
        for (const col of columns) {
            const queryTokens = q.split(/[\s_\-,.()\[\]]+/).filter(Boolean)
            const colTokens = col.column_name.toLowerCase().split(/[\s_]+/).filter(Boolean)

            const hasTokenMatch = colTokens.some(token =>
                queryTokens.some(qt =>
                    qt === token ||           // exact: "customer" == "customer"
                    qt.startsWith(token) ||   // prefix: "customers" starts with "customer"
                    token.startsWith(qt)      // prefix: "customer" starts with "custom"
                )
            )
            if (hasTokenMatch) {
                score += 2
                matchedOn.push(`column: ${col.column_name}`)
            }
        }

        // Tier 3: Semantic role match
        const semanticSignals: Record<string, string[]> = {
            currency: ["revenue", "sales", "income", "earnings", "profit", "amount", "total", "price", "cost"],
            quantity: ["quantity", "units", "sold", "count", "volume", "stock", "inventory"],
            date: ["date", "month", "year", "quarter", "week", "trend", "recent", "latest"],
            name: ["customer", "client", "buyer", "user", "top", "repeat"],
            product: ["product", "item", "sku", "category"],
            location: ["country", "region", "city", "where", "location", "territory"],
        }

        for (const col of columns) {
            const role = inferSemanticRole(col.column_name, col.column_type)
            const signals = semanticSignals[role] ?? []
            for (const signal of signals) {
                if (q.includes(signal)) {
                    score += 1
                    matchedOn.push(`semantic: ${col.column_name} (${role}) matched "${signal}"`)
                    break // one match per column
                }
            }
        }

        return { tableName, score, matchedOn }
    })

    // Sort by score descending
    const sorted = scored.sort((a, b) => b.score - a.score)

    // Return all tables with score > 0
    const relevant = sorted.filter(t => t.score > 0).map(t => t.tableName)

    // Fallback: if nothing matched, return all tables. AI will figure it out from full context
    return relevant.length > 0 ? relevant : tableNames
}