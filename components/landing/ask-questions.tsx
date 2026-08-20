'use client'

import { TrendingDown, BarChart3, CalendarDays, Target, Users, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { FadeIn } from './fade-in'

const questions = [
  {
    question: 'Why did sales drop last month?',
    category: 'Sales Analysis',
    Icon: TrendingDown,
  },
  {
    question: 'Which Meta Ads campaign has the lowest ROI?',
    category: 'Marketing',
    Icon: BarChart3,
  },
  {
    question: 'Compare June vs July revenue',
    category: 'Comparison',
    Icon: CalendarDays,
  },
  {
    question: 'Which products generate the highest profit?',
    category: 'Product',
    Icon: Target,
  },
  {
    question: 'Which customers drive most of our revenue?',
    category: 'Customers',
    Icon: Users,
  },
]

export function AskQuestions() {
  return (
    <section id="examples" className="relative py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16 space-y-4">
            <p className="font-mono text-[10px] font-medium text-primary uppercase tracking-[0.12em]">Examples</p>
            <h2 className="text-4xl md:text-5xl font-bold text-balance leading-tight">
              Ask questions like...
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              Schematic handles any business question. No SQL needed.
            </p>
          </div>
        </FadeIn>

        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {questions.map((item, index) => {
              const { Icon } = item
              return (
                <div
                  key={index}
                  className="group relative h-full"
                >
                  <div className="relative h-full flex flex-col bg-card/50 border border-border/40 rounded-xl p-6 transition-all duration-150 hover:border-primary/50 hover:bg-card/70 cursor-pointer">
                    <div className="relative z-10 flex flex-col h-full space-y-4">
                      <div className="flex items-start justify-between">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <div className="px-2 py-1 rounded-full bg-primary/10 border border-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-150">
                          <span className="font-mono text-[9px] font-medium text-primary uppercase tracking-[0.1em]">{item.category}</span>
                        </div>
                      </div>

                      <div className="flex-grow">
                        <p className="text-base md:text-sm lg:text-base font-medium text-foreground leading-snug">
                          {item.question}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <MessageCircle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium">
                          Try it
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </FadeIn>

        <FadeIn>
          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-6 text-lg">
              Or ask your own question — Schematic joins across tables and shows the SQL behind every answer.
            </p>
            <Link href="/signup" className="group mx-auto flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-8 py-4 font-medium text-primary transition-all duration-150 hover:border-primary/50 hover:bg-primary/20">
              <MessageCircle className="w-5 h-5" />
              <span>Start asking questions</span>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
