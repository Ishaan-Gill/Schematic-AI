'use client'

import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function AskQuestions() {
  const [, setHoveredIndex] = useState<number | null>(null)

  const questions = [
    {
      question: 'Why did sales drop last month?',
      category: 'Sales Analysis',
      icon: '📉',
    },
    {
      question: 'Which Meta Ads campaign has the lowest ROI?',
      category: 'Marketing',
      icon: '📊',
    },
    {
      question: 'Compare June vs July revenue',
      category: 'Comparison',
      icon: '📈',
    },
    {
      question: 'Which products generate the highest profit?',
      category: 'Product',
      icon: '🎯',
    },
    {
      question: 'Which customers drive most of our revenue?',
      category: 'Customers',
      icon: '👥',
    },
  ]

  return (
    <section id="examples" className="relative py-24 md:py-32 overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-80 h-80 bg-primary/4 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <p className="text-sm font-medium text-primary uppercase tracking-wide">Examples</p>
          <h2 className="text-4xl md:text-5xl font-bold text-balance leading-tight">
            Ask questions like...
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Schematic handles any business question. No SQL needed.
          </p>
        </div>

        {/* Questions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {questions.map((item, index) => (
            <div
              key={index}
              className="group relative h-full"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Chat bubble card */}
              <div className="relative h-full flex flex-col bg-gradient-to-br from-card/50 to-card/20 border border-border/40 rounded-2xl p-6 transition-all duration-300 hover:border-primary/50 hover:bg-gradient-to-br hover:from-card/70 hover:to-card/40 hover:shadow-lg hover:shadow-primary/5 cursor-pointer">
                {/* Background accent */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full space-y-4">
                  {/* Icon and category */}
                  <div className="flex items-start justify-between">
                    <div className="text-2xl">{item.icon}</div>
                    <div className="px-2 py-1 rounded-full bg-primary/10 border border-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-2">
                      <span className="text-xs font-medium text-primary">{item.category}</span>
                    </div>
                  </div>

                  {/* Question text */}
                  <div className="flex-grow">
                    <p className="text-base md:text-sm lg:text-base font-medium text-foreground leading-snug">
                      {item.question}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="flex items-center gap-2 pt-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium">
                      Try it
                    </span>
                  </div>
                </div>

                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6 text-lg">
            Or ask your own question. Schematic understands business context.
          </p>
          <Link href="/signup" className="group mx-auto flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-8 py-4 font-medium text-primary transition-all duration-200 hover:border-primary/50 hover:bg-primary/20">
            <MessageCircle className="w-5 h-5" />
            <span>Start asking questions</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
