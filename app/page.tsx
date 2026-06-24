"use client"
import { useEffect, useEffectEvent, useRef, useState } from "react"
import FileUpload from "@/components/ui/FileUpload"
import Sidebar from "@/components/ui/Sidebar"
import ChatPanel from "@/components/ui/ChatPanel"
import { getRelationshipsMemory, relationshipsMemory } from "@/lib/ai/relationshipsMap"
import { generateSQL } from "@/lib/sql/generateSQL"
import { runQuery } from "@/lib/sql/runQuery"
import { handleFile } from "@/lib/upload/uploadDataset"
import React from "react"

type Message = {
  id: string
  role: "user" | "assistant"
  query: string
  generatedSQL?: string
  queryResult?: Record<string, unknown>[]
  timestamp: string
}

type SchemaMap = Record<string, unknown[]>

export type Session = {
  id: string
  title: string
  messages: Message[]
}

const PAGE_SIZE = 100
export default function Home() {
  const [tables, setTables] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [generatedSQL, setGeneratedSQL] = useState("")
  const [loading, setLoading] = useState(false)
  const [queryResult, setQueryResult] = useState<Record<string, unknown>[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [schemas, setSchemas] = useState<SchemaMap>({})
  const [lastSQL, setLastSQL] = useState("")
  const uploadControllerRef = useRef<AbortController | null>(null)
  const queryControllerRef = useRef<AbortController | null>(null)
  const generateControllerRef = useRef<AbortController | null>(null)
  const fixAttemptsRef = useRef(0)
  const isMountedRef = useRef(true)

  const startController = (ref: React.MutableRefObject<AbortController | null>) => {
    ref.current?.abort()
    const controller = new AbortController()
    ref.current = controller
    return controller
  }
  const isControllerActive = (controller: AbortController) =>
    isMountedRef.current && !controller.signal.aborted

  const executeQuery = async (overrideQuery?: string) => {
    const controller = startController(queryControllerRef)
    fixAttemptsRef.current = 0

    await runQuery({
      generatedSQL: generatedSQL.trim(),
      query,
      schemas,
      setError,
      setGeneratedSQL,
      setQueryResult,
      relationships: getRelationshipsMemory(),
      page,
      PAGE_SIZE,
      signal: controller.signal,
      guard: () => isControllerActive(controller),
      setHasMore,
      fixAttemptsRef,
    }, overrideQuery)
  }

  const runQueryForPagination = useEffectEvent(async (overrideQuery?: string) => {
    await executeQuery(overrideQuery)
  })

  useEffect(() => {
    const uploadController = uploadControllerRef
    const queryController = queryControllerRef
    const generateController = generateControllerRef

    return () => {
      isMountedRef.current = false
      uploadController.current?.abort()
      queryController.current?.abort()
      generateController.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!generatedSQL) return
    void runQueryForPagination(generatedSQL)
  }, [generatedSQL, page])


  const handleNewChat = () => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
    }
    setSessions(prev => [newSession, ...prev])
    setActiveSessionId(newSession.id)
  }

  const handleSendMessage = async (query: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      query,
      timestamp: new Date().toISOString()
    }
    setSessions(prev =>
      prev.map(session =>
        session.id === activeSessionId
          ? {
            ...session,
            messages: [...session.messages, userMessage],
          }
          : session
      )
    )
    const controller = startController(generateControllerRef)
    queryControllerRef.current?.abort()
    setGeneratedSQL("")
    setQueryResult([])
    setHasMore(false)
    setPage(0)
    await generateSQL({
      query,
      schemas,
      generatedSQL,
      lastSQL,
      setError,
      setLoading,
      setGeneratedSQL,
      setLastSQL,
      signal: controller.signal,
      guard: () => isControllerActive(controller)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const controller = startController(uploadControllerRef)
    queryControllerRef.current?.abort()
    generateControllerRef.current?.abort()

    setGeneratedSQL("")
    setLastSQL("")
    setQueryResult([])
    setPage(0)
    setHasMore(false)

    await handleFile(e, {
      setTables,
      setError,
      setQuery,
      setGeneratedSQL,
      setSchemas,
      signal: controller.signal,
      guard: () => isControllerActive(controller)
    })
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#030405] text-zinc-100 md:h-screen md:flex-row">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_-10%,rgba(34,211,238,0.14),transparent_34rem),radial-gradient(circle_at_95%_20%,rgba(255,255,255,0.055),transparent_26rem),linear-gradient(180deg,#030405_0%,#06080a_48%,#020303_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:72px_72px]" />

      <Sidebar
        tables={tables}
        relationships={relationshipsMemory}
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        handleNewChat={handleNewChat}
      />

      <div className="relative flex min-h-0 flex-1 flex-col md:ml-[220px] md:overflow-y-auto">
        <ChatPanel
          query={query}
          generatedSQL={generatedSQL}
          loading={loading}
          hasResults={Boolean(generatedSQL)}
          error={error}
          rows={queryResult}
          page={page}
          hasMore={hasMore}
          setPage={setPage}
          queryResult={queryResult}
        />

        <FileUpload
          query={query}
          setQuery={setQuery}
          error={error}
          setError={setError}
          loading={loading}
          onSend={handleSendMessage}
          onFileChange={handleFileChange}
        />
      </div>
    </div>
  )
}
