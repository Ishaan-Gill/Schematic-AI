'use client'

import React from 'react'

interface BrowserWindowProps {
  children: React.ReactNode
  url?: string
}

export function BrowserWindow({
  children,
  url = 'getschematicai.com',
}: BrowserWindowProps) {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 bg-card/40 rounded-2xl border border-border/40 overflow-hidden flex flex-col">
        <div className="bg-card/60 border-b border-border/30 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
          </div>
          <div className="flex-1 flex items-center gap-2 px-3 py-1 bg-background/50 rounded-md border border-border/20">
            <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-muted-foreground truncate font-medium">{url}</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-background flex items-center justify-center p-6">
          <div className="relative w-full h-full flex items-center justify-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
