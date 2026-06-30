export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  generatedSQL?: string
  queryResult?: Record<string, unknown>[]
  loading?: boolean
  error?: string
  timestamp: string
}