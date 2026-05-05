"use client"
import { useState } from "react"
import FileUpload from "@/components/ui/FileUpload"

export default function Home() {
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string |null>(null)
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [generatedSQL, setGeneratedSQL] = useState("")

  return (
    <div className="flex h-screen">

      {/* Sidebar */}
      <div className="w-1/4 border-r p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-4">Uploaded Tables</h2>

        {/* table list */}
        {tables.length === 0 ? (
          <p className="text-sm text-gray-500">No tables yet</p>
        ) : (
          tables.map((table) => (
            <div
              key={table}
              onClick={() => setSelectedTable(table)}
              className={`p-2 cursor-pointer rounded ${
                selectedTable === table ? "bg-gray-200" : "hover:bg-gray-200"
              }`}
            >
              {table}
            </div>
          ))
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2x1 font-bold mb-4">Multi-Table Analyst</h1>
        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Upload your CSVs here </h2>
          <p className="text-sm text-gray-50 mb-2">
            Running on: <span className="font-medium">{selectedTable}</span>
          </p>
          {/* user input */}
          <textarea
            value={query}
            onChange={(e) => 
              {setQuery(e.target.value)
              if (error) setError(null)
            }}
            placeholder="Ask in English or Write SQL..."
            className="w-full border p-3 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {/* AI generated SQL */}
          <textarea
            value={generatedSQL}
            readOnly
            placeholder="AI-generated SQL..."
            className="w-full border p-3 rounded-lg bg-gray-100 mt-3 font-mono text-sm"
          />
          <FileUpload 
            tables={tables}
            setTables={setTables}
            selectedTable={selectedTable}
            setSelectedTable={setSelectedTable}
            query={query}
            setQuery={setQuery}
            error={error}
            setError={setError}
            generatedSQL={generatedSQL}
            setGeneratedSQL={setGeneratedSQL}
          />
        </div>
      </div>
    </div>
  )
}