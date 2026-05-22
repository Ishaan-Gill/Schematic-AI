import { detectRelationships } from "./relationships"
import type { Relationship, TableSchemas } from "./relationships"

export type { Relationship }

export const relationshipsMemory: Relationship[] = []

export const buildRelationshipsMemory = (schemas: TableSchemas) => {
    relationshipsMemory.length = 0
    relationshipsMemory.push(...detectRelationships(schemas))
    return relationshipsMemory
}

export const getRelationshipsMemory = () => relationshipsMemory