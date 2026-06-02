"use client"
import { useState } from "react"
import FileUpload from "@/components/ui/FileUpload"
import Sidebar from "@/components/ui/Sidebar"
import ChatPanel from "@/components/ui/ChatPanel"
import { relationshipsMemory } from "@/lib/ai/relationshipsMap"

export default function Home() {
  const [tables, setTables] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [generatedSQL, setGeneratedSQL] = useState("")
  const [loading, setLoading] = useState(false)
  const [queryResult, setQueryResult] = useState<Record<string, unknown>[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#030405] text-zinc-100 md:h-screen md:flex-row">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_-10%,rgba(34,211,238,0.14),transparent_34rem),radial-gradient(circle_at_95%_20%,rgba(255,255,255,0.055),transparent_26rem),linear-gradient(180deg,#030405_0%,#06080a_48%,#020303_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:72px_72px]" />

      <Sidebar
        tables={tables}
        relationships={relationshipsMemory}
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
        />

        <FileUpload
          setTables={setTables}
          query={query}
          setQuery={setQuery}
          error={error}
          setError={setError}
          generatedSQL={generatedSQL}
          setGeneratedSQL={setGeneratedSQL}
          loading={loading}
          setLoading={setLoading}
          setQueryResult={setQueryResult}
          page={page}
          setPage={setPage}
          setHasMore={setHasMore}
        />
      </div>
    </div>
  )
}
