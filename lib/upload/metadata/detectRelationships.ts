import { detectRelationships } from "@/lib/ai/relationships"
import type { TableSchemas } from "@/lib/ai/relationships"
import { relationshipsMemory } from "@/lib/ai/relationshipsMap"

export const updateDetectedRelationships = (updatedSchemas: TableSchemas) => {
    const detected = detectRelationships(updatedSchemas)
    relationshipsMemory.length = 0
    relationshipsMemory.push(...detected)

    return detected
}
