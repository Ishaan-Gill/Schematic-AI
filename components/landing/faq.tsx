"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useReveal } from "./landing-shared";

const faqs: Array<[string, string]> = [
  [
    "What can I upload?",
    "CSV and Excel files from the tools you already use. Upload multiple tables and Schematic connects the relevant context before it responds.",
  ],
  [
    "How are answers verified?",
    "Every answer keeps a clear trail back to the source columns, transformations, and generated SQL used to produce it.",
  ],
  [
    "Do I need to know SQL?",
    "No. Ask naturally. Schematic creates the query, but keeps it visible for the people who want to inspect the details.",
  ],
  [
    "Who is this for?",
    "Founders, operators, and finance teams who carry important business questions around but do not want to live in a spreadsheet to answer them.",
  ],
];

export function FAQ() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const ref = useReveal<HTMLDivElement>();

  return (
    <div ref={ref}>
      <section id="questions" className="faq-section">
        <div className="faq-section__heading" data-reveal>
          <p className="kicker">
            <span>05</span> Questions, answered
          </p>
          <h2>
            Let&rsquo;s make
            <br />
            this <i>concrete.</i>
          </h2>
        </div>
        <div className="faq-list" data-reveal data-reveal-delay="1">
          {faqs.map(([question, answer], index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                className={`faq-row ${isOpen ? "faq-row--open" : ""}`}
                key={question}
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-row__index">0{index + 1}</span>
                  <span>{question}</span>
                  <ChevronDown size={21} />
                </button>
                <div className="faq-row__answer">
                  <p>{answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="start" className="final-cta" data-reveal>
        <div className="final-cta__pane">
          <span className="final-cta__shine" aria-hidden="true" />
          <p className="kicker">
            <span>06</span> Your first question is waiting
          </p>
          <h2>
            Bring your
            <br />
            <i>spreadsheet.</i>
          </h2>
          <p>We&rsquo;ll bring the evidence trail.</p>
          <Link className="signal-button signal-button--large" href="/signup">
            Start asking questions <ArrowRight size={19} />
          </Link>
          <span className="final-cta__micro">
            No SQL setup. No dashboard build. Just a better next question.
          </span>
        </div>
      </section>
    </div>
  );
}
