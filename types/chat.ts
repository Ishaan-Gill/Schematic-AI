export type Session = {
  id: string;
  title: string;
  messages: Message[];
};

export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  generatedSQL?: string
  queryResult?: Record<string, unknown>[]
  loading?: boolean
  error?: string
  page?: number
  hasMore?: boolean
  timestamp: string
}