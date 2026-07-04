import { detectRelationships } from "@/lib/ai/context/relationships"
import type { TableSchemas } from "@/lib/ai/context/relationships"
import { relationshipsMemory } from "@/lib/ai/context/relationshipsMap"

export const updateDetectedRelationships = (updatedSchemas: TableSchemas) => {
    const detected = detectRelationships(updatedSchemas)
    relationshipsMemory.length = 0
    relationshipsMemory.push(...detected)

    return detected
}
