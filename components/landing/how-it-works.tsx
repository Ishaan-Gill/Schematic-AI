'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FadeIn } from './fade-in'

const steps = [
  {
    number: '01',
    title: 'Upload your data',
    description: 'Drag and drop your CSV file or click to browse. We support all standard formats and can handle files with thousands of rows.',
    features: ['Instant parsing', 'Auto-detection'],
  },
  {
    number: '02',
    title: 'Ask natural questions',
    description: 'Chat in plain English about your data. No SQL knowledge required. Our engine interprets your intent and generates accurate queries.',
    features: ['No SQL required', 'Multi-table joins'],
  },
  {
    number: '03',
    title: 'Get instant insights',
    description: 'Receive verified answers with visualizations and SQL queries. All results are transparent and auditable for complete confidence.',
    features: ['SQL output', 'Full transparency'],
  },
]

function UploadIllustration() {
  return (
    <svg className="w-full h-full" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="30" width="60" height="80" rx="4" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary/40" />
      <line x1="50" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1.5" className="text-primary/60" />
      <line x1="50" y1="65" x2="90" y2="65" stroke="currentColor" strokeWidth="1.5" className="text-primary/50" />
      <line x1="50" y1="80" x2="85" y2="80" stroke="currentColor" strokeWidth="1.5" className="text-primary/50" />
      <path d="M 100 125 L 100 140 M 95 135 L 100 140 L 105 135" stroke="currentColor" strokeWidth="2" className="text-primary" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function HowItWorks() {
  return (
    <section id="features" className="relative py-32 md:py-44 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold text-balance leading-tight">
              How it <span className="text-primary">works</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              From data upload to actionable insights in three steps
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
          {steps.map((step, index) => (
            <FadeIn key={index} delay={index * 0.08}>
              <div className="group relative h-full">
                <div className="relative h-full flex flex-col bg-card/40 border border-border/40 rounded-xl p-8 md:p-10 transition-all duration-150 hover:border-primary/40 hover:bg-card/60">
                  <div className="relative mb-8 h-48 md:h-56 -mx-8 -mt-8 md:-mx-10 md:-mt-10 mb-6 bg-primary/5 rounded-t-xl overflow-hidden flex items-center justify-center">
                    {index === 0 && <UploadIllustration />}
                    {index === 1 && (
                      <Image
                        src="/images/schematic-dashboard.png"
                        alt="Asking a question in Schematic AI"
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    )}
                    {index === 2 && (
                      <Image
                        src="/images/workspace-screenshot.png"
                        alt="Query results table in Schematic AI"
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    )}

                    <div className="absolute top-6 right-6 z-20">
                      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/40 transition-colors">
                        <span className="text-2xl font-bold text-primary">{step.number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col flex-grow space-y-4">
                    <div>
                      <h3 className="text-2xl md:text-2xl font-bold text-foreground mb-2 leading-tight">
                        {step.title}
                      </h3>
                      <p className="text-base text-muted-foreground leading-relaxed font-light">
                        {step.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-4 mt-auto">
                      {step.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-center gap-2 text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-150"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div className="mt-20 text-center">
            <p className="text-muted-foreground mb-6">
              Upload a spreadsheet and ask your first question.
            </p>
            <Link href="/signup" className="rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">
              Get Started Free
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
