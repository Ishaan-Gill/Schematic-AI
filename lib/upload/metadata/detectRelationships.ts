import { detectRelationships } from "@/lib/ai/relationships"
import { relationshipsMemory } from "@/lib/ai/relationshipsMap"

export const updateDetectedRelationships = (updatedSchemas: Record<string, any[]>) => {
    const detected = detectRelationships(updatedSchemas)

    const validRelationships = detected.filter(
        (item): item is Exclude<typeof item, string> =>
            typeof item !== "string"
    )
    relationshipsMemory.length = 0
    relationshipsMemory.push(...validRelationships)

    return validRelationships
}
