export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  generatedSQL?: string
  queryResult?: Record<string, unknown>[]
  status?: "thinking" | "running" | "success" | "error"
  error?: string
  timestamp: string
}