"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

type FAQItem = {
  question: string;
  answer: React.ReactNode;
};

const faqs: FAQItem[] = [
  {
    question: "How is Schematic AI different from ChatGPT?",
    answer: (
      <p>
        Schematic AI is designed specifically for analyzing structured business
        data. Instead of relying only on natural language responses, it
        generates SQL queries against your uploaded data and shows the SQL used
        to produce each answer.
      </p>
    ),
  },
  {
    question: "Can I upload multiple CSV or Excel files?",
    answer: (
      <p>
        Yes. Schematic AI can analyze multiple uploaded CSV and Excel files
        together, making it easier to answer questions that span different
        business reports.
      </p>
    ),
  },
  {
    question: "Do I need to know SQL or formulas?",
    answer: (
      <p>
        No. You upload your files and ask questions in plain English. Schematic
        AI writes the SQL needed to answer, so you do not have to.
      </p>
    ),
  },
  {
    question: "What file formats are supported?",
    answer: (
      <p>
        CSV and Excel files. Multiple files can be uploaded at once and analyzed
        together, which is useful for data exported from different tools.
      </p>
    ),
  },
  {
    question: "Does it modify my data?",
    answer: (
      <p>
        No. The product runs read-only SQL queries against your data. It does
        not edit, delete, or overwrite the files you upload.
      </p>
    ),
  },
  {
    question: "How are answers verified?",
    answer: (
      <p>
        Each question is translated into a SQL query that is validated before
        execution. The resulting SQL is shown alongside the answer so you can
        understand how the result was produced.
      </p>
    ),
  },
  {
    question: "What happens when the data cannot answer a question?",
    answer: (
      <p>
        If the uploaded data cannot confidently answer a question, Schematic AI
        says so instead of generating a plausible answer.
      </p>
    ),
  },
  {
    question: "Is my uploaded data private?",
    answer: (
      <p>
        Your uploaded files remain associated with your account and are not
        visible to other users. You can also review our Privacy Policy for
        details about how uploaded data is handled.
      </p>
    ),
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="space-y-4"
      aria-label="Frequently asked questions"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-foreground">
        Frequently asked questions
      </h2>

      <div className="space-y-4 pt-2">
        {faqs.map((faq, index) => {
          const open = openIndex === index;
          return (
            <div key={faq.question} className="group">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                aria-expanded={open}
                className="w-full py-5 px-6 flex items-start justify-between gap-4 rounded-xl border border-border/40 bg-card/20 hover:bg-card/40 transition-all duration-300 group-hover:border-primary/30"
              >
                <span className="text-left font-semibold text-foreground text-base md:text-lg leading-snug pt-0.5">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 mt-1 ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  open ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pt-0 pb-5">
                  <div className="text-base text-muted-foreground leading-relaxed font-light">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
