'use client'

import { useState } from 'react'
import Link from 'next/link'

export function HowItWorks() {
  const [, setHoveredIndex] = useState<number | null>(null)

  const steps = [
    {
      number: '01',
      title: 'Upload your data',
      description: 'Drag and drop your CSV file or click to browse. We support all standard formats and can handle files with thousands of rows.',
      features: ['Instant parsing', 'Auto-detection', 'Large file support'],
    },
    {
      number: '02',
      title: 'Ask natural questions',
      description: 'Chat in plain English about your data. No SQL knowledge required. Our AI interprets your intent and generates accurate queries.',
      features: ['AI-powered', 'Context-aware', 'Instant responses'],
    },
    {
      number: '03',
      title: 'Get instant insights',
      description: 'Receive verified answers with visualizations and SQL queries. All results are transparent and auditable for complete confidence.',
      features: ['Live charts', 'SQL output', 'Full transparency'],
    },
  ]

  // Miniature workflow illustrations for each step
  const StepIllustration = ({ index }: { index: number }) => {
    if (index === 0) {
      return (
        <svg className="w-full h-full" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(118, 213, 168, 0.3)" />
              <stop offset="100%" stopColor="rgba(118, 213, 168, 0.1)" />
            </linearGradient>
          </defs>
          {/* File icon */}
          <rect x="40" y="30" width="60" height="80" rx="4" fill="url(#grad1)" stroke="currentColor" strokeWidth="2" className="text-primary/40" />
          <line x1="50" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1.5" className="text-primary/60" />
          <line x1="50" y1="65" x2="90" y2="65" stroke="currentColor" strokeWidth="1.5" className="text-primary/50" />
          <line x1="50" y1="80" x2="85" y2="80" stroke="currentColor" strokeWidth="1.5" className="text-primary/50" />
          
          {/* Upload arrow */}
          <path d="M 100 125 L 100 140 M 95 135 L 100 140 L 105 135" stroke="currentColor" strokeWidth="2" className="text-primary" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Database/folder indication */}
          <rect x="50" y="150" width="80" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/50" />
          <text x="90" y="161" textAnchor="middle" fontSize="8" fill="currentColor" className="text-muted-foreground">Uploaded</text>
        </svg>
      )
    } else if (index === 1) {
      return (
        <svg className="w-full h-full" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Chat bubbles */}
          <rect x="30" y="25" width="110" height="35" rx="8" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/40" />
          <text x="45" y="50" fontSize="10" fill="currentColor" className="text-muted-foreground">Revenue by region?</text>
          
          <path d="M 140 30 L 150 25 L 150 40 Z" fill="currentColor" className="text-primary/40" />
          
          {/* Response bubble */}
          <rect x="40" y="70" width="130" height="45" rx="8" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" opacity="0.3" />
          <text x="55" y="88" fontSize="9" fill="currentColor" className="text-primary">SELECT region, SUM(revenue)</text>
          <text x="55" y="102" fontSize="9" fill="currentColor" className="text-primary">FROM sales GROUP BY region</text>
          <path d="M 40 75 L 30 70 L 30 85 Z" fill="currentColor" className="text-primary/40" />
          
          {/* Checkmark */}
          <circle cx="170" cy="115" r="12" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
          <path d="M 165 115 L 168 118 L 173 110" stroke="currentColor" strokeWidth="2" className="text-primary" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    } else {
      return (
        <svg className="w-full h-full" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Bar chart */}
          <rect x="30" y="35" width="12" height="40" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/50" />
          <rect x="30" y="35" width="12" height="40" fill="currentColor" fillOpacity="0.3" className="text-primary" rx="2" />
          
          <rect x="52" y="25" width="12" height="50" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/50" />
          <rect x="52" y="25" width="12" height="50" fill="currentColor" fillOpacity="0.5" className="text-primary" rx="2" />
          
          <rect x="74" y="40" width="12" height="35" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/50" />
          <rect x="74" y="40" width="12" height="35" fill="currentColor" fillOpacity="0.4" className="text-primary" rx="2" />
          
          <rect x="96" y="20" width="12" height="55" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/50" />
          <rect x="96" y="20" width="12" height="55" fill="currentColor" fillOpacity="0.6" className="text-primary" rx="2" />
          
          {/* Axis lines */}
          <line x1="25" y1="80" x2="125" y2="80" stroke="currentColor" strokeWidth="1" className="text-border" />
          <line x1="25" y1="15" x2="25" y2="80" stroke="currentColor" strokeWidth="1" className="text-border" />
          
          {/* Info card */}
          <rect x="35" y="105" width="110" height="50" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/40" />
          <text x="45" y="120" fontSize="9" fontWeight="bold" fill="currentColor" className="text-foreground">Total Revenue</text>
          <text x="45" y="135" fontSize="12" fontWeight="bold" fill="currentColor" className="text-primary">$2.4M</text>
          <text x="45" y="150" fontSize="8" fill="currentColor" className="text-muted-foreground">↑ 12% vs last month</text>
        </svg>
      )
    }
  }

  return (
    <section id="features" className="relative py-24 md:py-40 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-0 w-1/2 h-96 bg-primary/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/4 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-5xl md:text-6xl font-bold text-balance leading-tight">
            How it <span className="text-primary">works</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            From data upload to actionable insights in three intuitive steps
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Card container */}
              <div className="relative h-full flex flex-col bg-gradient-to-br from-card/40 to-card/20 border border-border/40 rounded-2xl p-8 md:p-10 transition-all duration-300 hover:border-primary/40 hover:bg-gradient-to-br hover:from-card/60 hover:to-card/40">
                {/* Illustration area */}
                <div className="relative mb-8 h-48 md:h-56 -mx-8 -mt-8 md:-mx-10 md:-mt-10 mb-6 bg-gradient-to-b from-primary/5 to-transparent rounded-t-2xl overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity">
                    <StepIllustration index={index} />
                  </div>
                  
                  {/* Step indicator */}
                  <div className="absolute top-6 right-6 z-20">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all">
                      <span className="text-2xl font-bold text-primary">{step.number}</span>
                    </div>
                  </div>

                  {/* Decorative grid pattern */}
                  <svg className="absolute inset-0 w-full h-full opacity-[0.02]" preserveAspectRatio="none">
                    <defs>
                      <pattern id={`grid-${index}`} width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#grid-${index})`} />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-grow space-y-4">
                  <div>
                    <h3 className="text-2xl md:text-2xl font-bold text-foreground mb-2 leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed font-light">
                      {step.description}
                    </p>
                  </div>

                  {/* Features list */}
                  <div className="space-y-2 pt-4 mt-auto">
                    {step.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center gap-2 text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                        style={{ transitionDelay: `${featureIndex * 50}ms` }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Connection line (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/4 w-6 h-px bg-gradient-to-r from-primary/50 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="mt-20 text-center">
          <p className="text-muted-foreground mb-6">
            Ready to transform your data into insights?
          </p>
          <Link href="/signup" className="rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Get Started Free
          </Link>
        </div>
      </div>
    </section>
  )
}
