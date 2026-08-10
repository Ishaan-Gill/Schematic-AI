"use client"

import { CheckCircle2 } from "lucide-react"

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
          <span className="inline-flex rounded-[4px] border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.1)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#f59e0b]">
            Warnings
          </span>
          <ul className="space-y-1">
            {warnings.map((warning) => (
              <li
                key={warning}
                className="rounded-[4px] border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.08)] px-2 py-1 font-mono text-[9px] leading-[1.5] text-[#f59e0b]/90"
              >
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {normalizationNotes.length > 0 && (
        <div className="space-y-1.5">
          <span className="inline-flex rounded-[4px] border border-[rgba(79,255,176,0.2)] bg-[rgba(79,255,176,0.1)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#4fffb0]">
            Normalization
          </span>
          <ul className="space-y-1">
            {normalizationNotes.map((note) => (
              <li
                key={note}
                className="flex items-start gap-1.5 rounded-[4px] border border-[rgba(79,255,176,0.2)] bg-[rgba(79,255,176,0.06)] px-2 py-1 font-mono text-[9px] leading-[1.5] text-[#4fffb0]/90"
              >
                <CheckCircle2
                  className="mt-px size-2.5 shrink-0 text-[#4fffb0]"
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
