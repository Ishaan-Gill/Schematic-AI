import { datasetMemory } from "@/lib/upload/metadata/datasetMemory"

export const buildGlobalDatasetContext = () => {
    const sections: string[] = []

    for (const [tableName, memory] of Object.entries(datasetMemory)) {
        sections.push(`TABLE: ${tableName}`)

        sections.push("SCHEMA:")
        for (const column of memory.schema) {
            sections.push(
                `- ${column.column_name} (${column.column_type})`
            )
        }

        sections.push("PROFILE:")
        for (const [columnName, profile] of Object.entries(memory.profile)) {
            sections.push(
                `- ${columnName}: ${profile.uniqueValues} unique values`
            )
        }

        if (memory.semantic) {
            sections.push("SEMANTIC CONTEXT:")
            sections.push(
                JSON.stringify(memory.semantic, null, 2)
            )
        }

        if (memory.relationships?.length) {
            sections.push("RELATIONSHIPS:")
            sections.push(
                JSON.stringify(memory.relationships, null, 2)
            )
        }

        sections.push("\n")
    }

    return sections.join("\n")
}