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
import { Message } from "@/types/message"
import { ToastItem } from "@/types/toast"
import ToastContainer from "@/components/ui/ToastContainer"


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
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [schemas, setSchemas] = useState<SchemaMap>({})
  const [lastSQL, setLastSQL] = useState("")
  const [toasts, setToasts] = useState<ToastItem[]>([])
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

  const executeQuery = async (sql?: string, assistantMessageId = "", page = 0) => {
    const controller = startController(queryControllerRef)
    fixAttemptsRef.current = 0

    if (!sql) return

    await runQuery({
      sql: sql.trim(),
      query,
      schemas,
      relationships: getRelationshipsMemory(),
      page: page,
      PAGE_SIZE,
      signal: controller.signal,
      guard: () => isControllerActive(controller),
      fixAttemptsRef,
      assistantMessageId: assistantMessageId!,
      updateMessage,
    })
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

  const activeSession = sessions.find(s => s.id === activeSessionId)

  const latestSQL = [...(activeSession?.messages ?? [])].reverse().find((m) => m.generatedSQL)?.generatedSQL

  const handleNewChat = () => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
    }
    setSessions(prev => [newSession, ...prev])
    setActiveSessionId(newSession.id)
  }

  const updateMessage = (
    messageId: string,
    updates: Partial<Message>
  ) => {
    setSessions(prev =>
      prev.map(session =>
        session.id !== activeSessionId
          ? session
          : {
            ...session,
            messages: session.messages.map(message =>
              message.id === messageId
                ? { ...message, ...updates }
                : message
            ),
          }
      )
    )
  }

  const handleSendMessage = async (query: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
      timestamp: new Date().toISOString()
    }
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      generatedSQL: "",
      queryResult: [],
      page: 0,
      hasMore: false,
      timestamp: new Date().toISOString()
    }
    updateMessage(assistantMessage.id, {
      error: undefined
    })
    setSessions(prev =>
      prev.map(session =>
        session.id === activeSessionId
          ? {
            ...session,
            messages: [...session.messages, userMessage, assistantMessage],
          }
          : session
      )
    )
    const controller = startController(generateControllerRef)
    queryControllerRef.current?.abort()
    updateMessage(assistantMessage.id, {
      page: 0,
      hasMore: false
    })
    const result = await generateSQL({
      query,
      schemas,
      lastSQL,
      setLastSQL,
      signal: controller.signal,
      guard: () => isControllerActive(controller)
    })

    if (!result.ok) {
      updateMessage(assistantMessage.id, {
        error: result.error,
        loading: false
      })
      return
    }

    const sql = result.sql
    updateMessage(assistantMessage.id, { 
      generatedSQL: sql, 
      content: "Generated SQL successfully", 
      loading: false 
    })
    await executeQuery(sql, assistantMessage.id)
  }

  const showToast = (
    type: ToastItem["type"],
    message: string
  ) => {
    setToasts(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        message,
      },
    ])
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const controller = startController(uploadControllerRef)
    queryControllerRef.current?.abort()
    generateControllerRef.current?.abort()

    setLastSQL("")

    await handleFile(e, {
      setTables,
      setQuery,
      setSchemas,
      signal: controller.signal,
      guard: () => isControllerActive(controller),
      showToast,
    })
  }

  const latestAssistantLoading = [...(activeSession?.messages ?? [])].reverse().find(m => m.role === "assistant")?.loading ?? false

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#030405] text-zinc-100 md:h-screen md:flex-row">

      <ToastContainer
        toasts={toasts}
        setToasts={setToasts}
      />

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
          messages={activeSession?.messages ?? []}
          hasResults={Boolean(latestSQL)}
          updateMessage={updateMessage}
          executeQuery={executeQuery}
        />

        <FileUpload
          query={query}
          setQuery={setQuery}
          loading={latestAssistantLoading}
          onSend={handleSendMessage}
          onFileChange={handleFileChange}
        />
      </div>
    </div>
  )
}
