"use client";

import { useState } from "react";
import { ArrowRight, CircleCheck, MoveUpRight } from "lucide-react";
import { AnchorLink, EvidenceStamp, useReveal } from "./landing-shared";

const questions = [
  "Which products held margin as ad spend rose?",
  "Where did repeat revenue change this quarter?",
  "What changed before conversions dropped?",
];

function InsightPane({ selectedQuestion }: { selectedQuestion: number }) {
  const headline =
    selectedQuestion === 0
      ? "Margin held because repeat purchase did."
      : selectedQuestion === 1
        ? "Cadence, not discounting, changed repeat revenue."
        : "The conversion decline began before checkout.";

  return (
    <div
      className="insight-pane"
      aria-label="Example data insight product interface"
    >
      <aside className="insight-pane__nav">
        <p>DATASETS</p>
        <span>orders.csv</span>
        <span>campaigns.csv</span>
        <span>products.xlsx</span>
      </aside>
      <div className="insight-pane__body">
        <div className="insight-pane__prompt">
          <span>{questions[selectedQuestion]}</span>
          <b>verified</b>
        </div>
        <div className="insight-pane__result">
          <div className="insight-pane__summary">
            <span>ANSWER</span>
            <strong>{headline}</strong>
            <p>Connected from spend, orders, and product tables.</p>
          </div>
          <div
            className="insight-pane__matrix"
            aria-label="Result bar chart"
          >
            <b />
            <b />
            <b />
            <b />
          </div>
        </div>
        <div className="insight-pane__table">
          <div>
            <span>PRODUCT</span>
            <span>REPEAT</span>
            <span>MARGIN</span>
          </div>
          <div>
            <span>Core</span>
            <span>42%</span>
            <b>+18%</b>
          </div>
          <div>
            <span>Plus</span>
            <span>38%</span>
            <b>+11%</b>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AskQuestions() {
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} className="scenario-section">
      <div className="scenario-heading" data-reveal>
        <p className="kicker">
          <span>03</span> Built for the question behind the report
        </p>
        <h2>
          Start where
          <br />
          the <i>uncertainty</i> is.
        </h2>
      </div>
      <div className="scenario-cards" data-reveal data-reveal-delay="1">
        {questions.map((question, index) => (
          <button
            className={`scenario-card ${selectedQuestion === index ? "scenario-card--active" : ""}`}
            key={question}
            onClick={() => setSelectedQuestion(index)}
          >
            <span className="scenario-card__meta">
              <span>0{index + 1}</span>
              <span>
                {index === 0 ? "Margin" : index === 1 ? "Retention" : "Conversion"}
              </span>
            </span>
            <span className="scenario-card__question">{question}</span>
            <span className="scenario-card__footer">
              <span>
                {selectedQuestion === index ? "Inspect evidence" : "Follow trail"}
              </span>
              <ArrowRight size={17} />
            </span>
          </button>
        ))}
      </div>
      <div className="scenario-detail" data-reveal data-reveal-delay="1">
        <div className="scenario-detail__copy">
          <EvidenceStamp>Shown with its work</EvidenceStamp>
          <h3>
            {selectedQuestion === 0
              ? "Margin held because repeat purchase did."
              : selectedQuestion === 1
                ? "A change in cadence shifted repeat revenue."
                : "The drop started upstream of the checkout."}
          </h3>
          <p>
            {selectedQuestion === 0
              ? "Schematic relates spend data to product-level contribution, then surfaces the condition that explains the pattern."
              : selectedQuestion === 1
                ? "Schematic looks across customer and order data to isolate the most meaningful shift—without asking you to build the join."
                : "Schematic traces the conversion signal back through the relevant campaign and order data, rather than offering a confident guess."}
          </p>
          <AnchorLink id="proof" className="quiet-link">
            See the source trail <MoveUpRight size={15} />
          </AnchorLink>
        </div>
        <div className="scenario-detail__pane">
          <InsightPane selectedQuestion={selectedQuestion} />
          <div className="pane-callout">
            <CircleCheck size={18} />
            <span>Every answer has an audit path.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
