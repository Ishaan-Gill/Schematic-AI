'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { BrowserWindow } from './browser-window'

export function Hero() {
  return (
    <section id="hero" className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-primary/5 via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center">
          {/* Left side - Content */}
          <div className="space-y-6 md:space-y-8 pt-0 lg:pt-8">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-xs font-medium text-primary">Powered by AI</span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-balance tracking-tight">
                Ask questions about your <span className="text-primary">data</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg font-light">
                Upload a CSV, ask in plain English, get verified insights instantly. No SQL knowledge required.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/signup" className="group flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 md:px-8 md:py-4">
                Start Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 pt-6 border-t border-border/30">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border 2 border-background flex items-center justify-center text-xs font-semibold text-primary"
                  >
                    {i}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Built for <span className="font-medium text-foreground">CSVs</span> & multi-table <span className="font-medium text-foreground">Excel</span> files.
              </p>
            </div>
          </div>

          {/* Right side - Browser window with demo */}
          <div className="relative h-96 md:h-[450px] lg:h-[550px] w-full">
            <BrowserWindow>
              <div className="w-full h-full space-y-4 text-center flex flex-col items-center justify-center px-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="space-y-2 max-w-sm">
                  <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium">GOOD EVENING</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                    What would you like to analyze?
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Upload a CSV file or ask a natural language question about your business metrics.
                  </p>
                </div>

                <div className="w-full max-w-sm pt-4 space-y-2">
                  <div className="group bg-card/40 hover:bg-card/60 border border-border/30 hover:border-primary/30 rounded-lg p-3 flex items-center gap-3 transition-all cursor-pointer">
                    <div className="w-8 h-8 rounded-md bg-primary/20 group-hover:bg-primary/30 flex items-center justify-center text-primary flex-shrink-0 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <span className="text-xs text-muted-foreground flex-1 font-medium">Step 1: Upload your data</span>
                    <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="group bg-card/40 hover:bg-card/60 border border-border/30 hover:border-primary/30 rounded-lg p-3 flex items-center gap-3 transition-all cursor-pointer">
                    <div className="w-8 h-8 rounded-md bg-primary/20 group-hover:bg-primary/30 flex items-center justify-center text-primary flex-shrink-0 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <span className="text-xs text-muted-foreground flex-1 font-medium">Step 2: Ask a question</span>
                    <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </BrowserWindow>
          </div>
        </div>
      </div>
    </section>
  )
}
