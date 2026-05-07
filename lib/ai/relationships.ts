export const detectRelationships = (schemas: Record<string, any[]>) => {
    const relations: string[] = []
    const tableNames = Object.keys(schemas)

    for (let i = 0; i < tableNames.length; i++) {
        for (let j = 0; j < tableNames.length; j++) {
            if (i === j) continue

            const tableA = tableNames[i]
            const tableB = tableNames[j]
            const colsA = schemas[tableA].map((c: any) => c.column_name.toLowerCase())
            const colsB = schemas[tableB].map((c: any) => c.column_name.toLowerCase())
            const singularTableB = tableB.endsWith("s") ? tableB.slice(0, -1) : tableB
            const expectedForeignKey = `${singularTableB}_id`

            if (colsA.includes(expectedForeignKey) && colsB.includes("id")) {
                relations.push(`${tableA}.${expectedForeignKey} -> ${tableB}.id`)
            }
        }
    }

    return relations
}
