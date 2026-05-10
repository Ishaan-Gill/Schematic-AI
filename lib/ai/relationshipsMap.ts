export type Relationship = {
    fromTable: string
    fromColumn: string
    toTable: string
    toColumn: string
}

export const relationshipsMemory: Relationship[] = []
