import { detectRelationships } from "@/lib/ai/context/relationships"
import type { Relationship, TableSchemas } from "@/lib/ai/context/relationships"

export type { Relationship }

export const relationshipsMemory: Relationship[] = []

export const buildRelationshipsMemory = (schemas: TableSchemas) => {
    relationshipsMemory.length = 0
    relationshipsMemory.push(...detectRelationships(schemas))
    return relationshipsMemory
}

export const getRelationshipsMemory = () => relationshipsMemory