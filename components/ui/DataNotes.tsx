"use client"

import { CheckCircle2, AlertTriangle } from "lucide-react"

type DataNotesProps = {
  warnings: string[]
  normalizationNotes: string[]
}

export default function DataNotes({
  warnings,
  normalizationNotes,
}: DataNotesProps) {
  if (warnings.length === 0 && normalizationNotes.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em]"
            style={{
              background: "#92400e",
              color: "#ffffff",
              border: "1px solid rgba(146,64,14,0.3)",
            }}
          >
            <AlertTriangle className="size-2.5" aria-hidden="true" />
            Normalization
          </span>
          <ul className="space-y-1">
            {warnings.map((warning) => (
              <li
                key={warning}
                className="rounded-md px-2.5 py-1.5 font-mono text-[9px] leading-[1.5]"
                style={{
                  border: "1px solid rgba(146,64,14,0.2)",
                  borderLeft: "3px solid #92400e",
                  background: "#fef3c7",
                  color: "#92400e",
                }}
              >
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {normalizationNotes.length > 0 && (
        <div className="space-y-1.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em]"
            style={{
              background: "#157347",
              color: "#ffffff",
              border: "1px solid rgba(21,115,71,0.3)",
            }}
          >
            <CheckCircle2 className="size-2.5" aria-hidden="true" />
            Verified
          </span>
          <ul className="space-y-1">
            {normalizationNotes.map((note) => (
              <li
                key={note}
                className="flex items-start gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[9px] leading-[1.5]"
                style={{
                  border: "1px solid rgba(21,115,71,0.2)",
                  background: "#e8f0e9",
                  color: "#157347",
                }}
              >
                <CheckCircle2
                  className="mt-px size-2.5 shrink-0"
                  style={{ color: "#157347" }}
                  aria-hidden="true"
                />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
