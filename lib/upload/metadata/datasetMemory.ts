import type { TableProfile } from "./profileMemory"

export type DatasetMemory = {
    schema: { column_name: string; column_type: string }[]
    profile: TableProfile
    semantic?: unknown
    relationships?: unknown[]
    feedback?: {
        successfulQueries: string[]
        failedQueries: { question: string; sql: string; error: string }[]
  }
}
export const datasetMemory: Record<string, DatasetMemory> = {}