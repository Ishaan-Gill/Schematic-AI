'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: '[Question placeholder]',
      answer: '[Answer placeholder]',
    },
    {
      question: '[Question placeholder]',
      answer: '[Answer placeholder]',
    },
    {
      question: '[Question placeholder]',
      answer: '[Answer placeholder]',
    },
    {
      question: '[Question placeholder]',
      answer: '[Answer placeholder]',
    },
    {
      question: '[Question placeholder]',
      answer: '[Answer placeholder]',
    },
    {
      question: '[Question placeholder]',
      answer: '[Answer placeholder]',
    },
  ]

  return (
    <section id="faq" className="relative py-24 md:py-40 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-20 space-y-6 text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-balance leading-tight">
              Questions?
            </h2>
            <p className="text-xl text-muted-foreground font-light leading-relaxed">
              We&apos;ve gathered the most common questions about Schematic.ai. Can&apos;t find what you need? Reach out to our team.
            </p>
          </div>

          {/* Accordion */}
          <div className="space-y-4 mb-16">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="group"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full py-5 px-6 md:px-8 flex items-start justify-between gap-4 rounded-xl border border-border/40 bg-card/20 hover:bg-card/40 transition-all duration-300 group-hover:border-primary/30"
                >
                  <span className="text-left font-semibold text-foreground text-lg md:text-xl leading-snug pt-0.5">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 mt-1 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Expanded answer */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === index ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 md:px-8 pt-0 pb-5">
                    <p className="text-base text-muted-foreground leading-relaxed font-light">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center space-y-6 pt-8 border-t border-border/30">
            <div className="space-y-2">
              <p className="text-muted-foreground font-light">
                Still looking for answers?
              </p>
              <p className="text-foreground font-medium">
                Our team is ready to help.
              </p>
            </div>
            <a
              href="mailto:support@schematic.ai"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors duration-200"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
