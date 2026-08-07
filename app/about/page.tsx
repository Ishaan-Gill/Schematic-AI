import type { Metadata } from "next";
import Link from "next/link";
import { LegalHeader } from "@/components/legal/legal-header";
import { Footer } from "@/components/landing/footer";
import { FAQ } from "@/components/about/faq";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn what Schematic AI is, who it is built for, how it works, and how it helps businesses analyze CSV and Excel data using AI.",
};

const exampleQuestions = [
  "Which products generated the most revenue?",
  "Why did revenue decrease last month?",
  "Which marketing campaign had the highest ROI?",
  "Who are my highest-value customers?",
  "Which regions are growing fastest?",
];

const audience = [
  {
    name: "Founders",
    description:
      "Need answers from their data but do not have time to build and maintain a reporting layer.",
  },
  {
    name: "Operations teams",
    description:
      "Work with exports from everyday business tools and need numbers to make decisions.",
  },
  {
    name: "Finance teams",
    description:
      "Analyze revenue, costs, and margins without waiting on ad-hoc reports.",
  },
  {
    name: "Marketing teams",
    description:
      "Compare campaign performance and attribution across channels.",
  },
  {
    name: "Teams working with exported reports",
    description:
      "Anyone who regularly handles CSV and Excel files pulled from their business software.",
  },
];

const steps = [
  {
    title: "Upload files",
    description:
      "Bring in the CSV and Excel files you already export from your business tools, whether one file or several.",
  },
  {
    title: "Understand schema",
    description:
      "Schematic AI examines the structure of the uploaded data to learn what each column and table contains.",
  },
  {
    title: "Ask questions",
    description:
      "You ask a question in plain English, with no formula, SQL, or dashboard required.",
  },
  {
    title: "Generate SQL",
    description:
      "The question is translated into a SELECT-only SQL query against your uploaded data.",
  },
  {
    title: "Validate results",
    description:
      "The generated query is validated before execution to help ensure it is safe and compatible with the uploaded data.",
  },
  {
    title: "Explain answers",
    description:
      "The answer is returned alongside the SQL used, so you can see exactly how it was derived.",
  },
];

const trustPoints = [
  {
    title: "SQL-backed analysis",
    description:
      "Every answer is produced by running a real SQL query against your uploaded data, rather than inferred from a summary.",
  },
  {
    title: "Transparent generated SQL",
    description:
      "The SQL used for an answer is shown to you, so the reasoning behind a number is open to inspection.",
  },
  {
    title: "Validation",
    description:
      "Queries are checked before execution, and results are confirmed before they are presented as an answer.",
  },
  {
    title: "Warnings when assumptions exist",
    description:
      "When a question depends on an assumption, or when the data is ambiguous, Schematic AI says so instead of hiding it.",
  },
  {
    title: "Correctness over hallucination",
    description:
      "When an answer cannot be derived confidently, the product says so rather than produce a plausible but unsupported number.",
  },
];

const exclusions = [
  "A spreadsheet editor for editing or formatting cells.",
  "A replacement for a dedicated BI dashboard system.",
  "An autonomous AI agent that acts on your data without your direction.",
  "A tool that silently modifies, deletes, or overwrites your uploaded data.",
];

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <LegalHeader />

      <div className="container mx-auto px-4 relative z-10 py-24 md:py-32">
        <article className="max-w-3xl mx-auto space-y-24 md:space-y-32">
          <header className="space-y-6">
            <p className="text-sm font-medium text-primary uppercase tracking-wide">
              About
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-balance leading-tight">
              About Schematic AI
            </h1>
            <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-2xl">
              Schematic AI is an AI data analyst for business data. Businesses can upload CSV and Excel files, ask questions in plain English, and receive answers backed by SQL queries against their own data.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              What is Schematic AI?
            </h2>
            <p>
              Schematic AI is an AI data analyst that allows businesses to upload
              CSV and Excel files, ask questions in plain English, and receive
              answers backed by SQL queries executed against your uploaded data. It operates on the files that
              already exist within a business &mdash; exports from tools such as Shopify, Stripe, Meta Ads, HubSpot, QuickBooks, and similar business software.
            </p>
            <p>
              The product is designed around the observation that much of the
              data a small business relies on is stored in exported spreadsheets
              rather than in a managed database. Rather than requiring SQL knowledge or a business intelligence dashboard, Schematic AI ingests those
              files directly and answers questions over them.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Who is it for?
            </h2>
            <p>
              Schematic AI is built for people who need answers from their
              business data but do not write SQL or maintain a data pipeline. The
              intended audience includes:
            </p>
            <ul className="space-y-6 mt-8">
              {audience.map((item) => (
                <li
                  key={item.name}
                  className="rounded-xl border border-border/40 bg-card/20 p-6"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {item.name}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed font-light">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
            <p>
              In short, it suits businesses that work with exported CSV and Excel
              reports on a regular basis.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              What problems does it solve?
            </h2>
            <p>
              The product answers questions that otherwise require manual work in
              a spreadsheet or a custom report. Typical questions include:
            </p>
            <ul className="space-y-3 mt-8">
              {exampleQuestions.map((q) => (
                <li
                  key={q}
                  className="rounded-xl border border-border/40 bg-card/20 px-6 py-5 font-mono text-base text-foreground/90"
                >
                  {q}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              How it works
            </h2>
            <ol className="relative mt-8 space-y-10 border-l border-border/40 ml-3">
              {steps.map((step, index) => (
                <li key={step.title} className="relative ml-6">
                  <span className="absolute -left-[13px] top-1 h-3.5 w-3.5 rounded-full border border-primary/40 bg-background" />
                  <span className="font-mono text-xs text-primary uppercase tracking-wide">
                    Step {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground mt-1">
                    {step.title}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed font-light mt-1">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Why trust the answers?
            </h2>
            <p>
              The product is built around a single principle: answers should
              come from the data, not from inference. It is reflected in the
              following design choices:
            </p>
            <ul className="space-y-6 mt-8">
              {trustPoints.map((point) => (
                <li key={point.title}>
                  <h3 className="text-lg font-semibold text-foreground">
                    {point.title}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed font-light mt-1">
                    {point.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              What Schematic AI doesn&apos;t do
            </h2>
            <p>
              To be clear about scope, Schematic AI is not the following:
            </p>
            <ul className="space-y-3 mt-6">
              {exclusions.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-base text-muted-foreground leading-relaxed"
                >
                  <span className="text-primary mt-1.5 text-sm">&bull;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <FAQ />

          <div className="space-y-8 pt-8 border-t border-border/30">
            <p className="text-muted-foreground font-light leading-relaxed max-w-xl">
              Schematic AI is actively evolving.
            </p>

            <div>
              <p className="text-sm font-medium text-foreground mb-4 uppercase tracking-wide text-muted-foreground">
                Learn more
              </p>
              <ul className="space-y-2 text-base">
                <li>
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="text-primary hover:underline">
                    Start using Schematic AI
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </article>
      </div>

      <Footer />
    </main>
  );
}