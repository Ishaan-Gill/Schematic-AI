"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  type FAQItem = {
    question: string;
    answer: React.ReactNode;
  };

  const faqs: FAQItem[] = [
    {
      question: "Do I need SQL or Excel skills?",
      answer: (
        <>
          <p>
            <strong>No.</strong> Upload your business data and ask questions in
            plain English. Replace this text.
          </p>

          <p className="font-medium">Examples:</p>

          <ul className="list-disc pl-6 space-y-1">
            <li>Which products generated the most revenue last month?</li>
            <li>Why did sales drop in April?</li>
            <li>Which customers have the highest lifetime value?</li>
          </ul>

          <p>
            Schematic.ai handles the analysis so you don&apos;t have to write
            formulas or SQL. Replace this closing paragraph.
          </p>
        </>
      ),
    },
    {
      question: "What files can I upload?",
      answer: (
        <>
          <p>
            Schematic.ai supports <strong>CSV and Excel files</strong>, even if
            they are exported from different business tools.
          </p>

          <p className="font-medium">Supported sources include:</p>

          <ul className="list-disc pl-6 space-y-1">
            <li>Shopify</li>
            <li>Stripe</li>
            <li>Meta Ads</li>
            <li>CRMs and inventory systems</li>
          </ul>

          <p>
            Upload multiple datasets together and ask questions across all of
            them.
          </p>
        </>
      ),
    },
    {
      question: "Can I trust the answers?",
      answer: (
        <>
          <p>
            <strong>Yes—but only when your data supports them.</strong>
          </p>

          <p className="font-medium">
            Schematic.ai is designed to be transparent:
          </p>

          <ul className="list-disc pl-6 space-y-1">
            <li>Answers are generated from your uploaded data.</li>
            <li>
              SQL is used behind the scenes to retrieve the correct information.
            </li>
            <li>
              If a question can not be answered confidently, Schematic.ai tells
              you instead of making something up.
            </li>
          </ul>

          <p>
            Accuracy and trust are prioritized over generating confident-looking
            answers.
          </p>
        </>
      ),
    },
    {
      question: "Is my data secure?",
      answer: (
        <>
          <p>
            <strong>Yes.</strong> Your uploaded files remain private to your
            account.
          </p>

          <p className="font-medium">We take privacy seriously:</p>

          <ul className="list-disc pl-6 space-y-1">
            <li>Your datasets are only accessible by you.</li>
            <li>Your data is never shared with other users.</li>
            <li>Your uploaded business data is not used to train AI models.</li>
          </ul>

          <p>Your files are only processed to answer the questions you ask.</p>
        </>
      ),
    },
    {
      question: "Who is Schematic.ai for?",
      answer: (
        <>
          <p>
            Schematic.ai is built for{" "}
            <strong>founders, operators, and small business teams</strong> who
            want answers from their data without hiring an analyst.
          </p>

          <p className="font-medium">It is a great fit if you:</p>

          <ul className="list-disc pl-6 space-y-1">
            <li>Spend hours analyzing spreadsheets.</li>
            <li>Export reports from multiple business tools.</li>
            <li>Need quick answers without writing SQL.</li>
          </ul>

          <p>
            If you&apos;ve ever thought: I know the data exists—I just can&apos;t find the answer. Schematic.ai is built for you.
          </p>
        </>
      ),
    },
    {
      question: "How quickly can I get started?",
      answer: (
        <>
          <p>
            <strong>Usually in under a minute.</strong>
          </p>

          <p className="font-medium">Getting started is simple:</p>

          <ul className="list-disc pl-6 space-y-1">
            <li>Create your free account.</li>
            <li>Upload your business data.</li>
            <li>Ask questions in plain English.</li>
          </ul>

          <p>No database setup, dashboards, or SQL knowledge required.</p>
        </>
      ),
    },
  ];

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
              We&apos;ve gathered the most common questions about Schematic.ai.
              Can&apos;t find what you need? Reach out to our team.
            </p>
          </div>

          {/* Accordion */}
          <div className="space-y-4 mb-16">
            {faqs.map((faq, index) => (
              <div key={index} className="group">
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full py-5 px-6 md:px-8 flex items-start justify-between gap-4 rounded-xl border border-border/40 bg-card/20 hover:bg-card/40 transition-all duration-300 group-hover:border-primary/30"
                >
                  <span className="text-left font-semibold text-foreground text-lg md:text-xl leading-snug pt-0.5">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 mt-1 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expanded answer */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === index ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <div className="px-6 md:px-8 pt-0 pb-5">
                    <div className="text-base text-muted-foreground leading-relaxed font-light space-y-4">
                      {faq.answer}
                    </div>
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
              href="mailto:getschematicai@gmail.com"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors duration-200"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
