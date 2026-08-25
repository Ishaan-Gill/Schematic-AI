"use client";

import { Layers3, ShieldCheck, WandSparkles } from "lucide-react";
import { EvidenceStamp, useReveal } from "./landing-shared";

function DataRail() {
  return (
    <div
      className="data-rail"
      aria-label="A data trail from question through SQL to a verified result"
    >
      <div className="data-rail__cell">
        <span className="data-rail__label">QUESTION</span>
        <div className="data-rail__lines">
          <span />
          <span />
          <span />
        </div>
        <i className="data-rail__connector" />
      </div>
      <div className="data-rail__cell">
        <span className="data-rail__label">SQL</span>
        <div className="data-rail__lines">
          <span />
          <span />
          <span />
        </div>
        <i className="data-rail__connector" />
      </div>
      <div className="data-rail__cell">
        <span className="data-rail__label">RESULT</span>
        <div className="data-rail__chart">
          <b />
          <b />
          <b />
          <b />
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  const ref = useReveal<HTMLElement>();

  return (
    <section id="method" ref={ref} className="question-runway">
      <div className="runway-intro" data-reveal>
        <p className="kicker">
          <span>02</span> The evidence runway
        </p>
        <h2>
          One question.
          <br />
          <i>Several receipts.</i>
        </h2>
        <p>
          Data work is not a magic trick. Schematic makes the thinking visible
          without making you do it yourself.
        </p>
      </div>
      <div className="runway-flow" data-reveal data-reveal-delay="1">
        <div className="runway-flow__line" aria-hidden="true">
          <span />
        </div>
        <article className="runway-step">
          <span className="step-index">01 / ASK</span>
          <div className="step-icon">
            <WandSparkles size={23} />
          </div>
          <h3>Say it the way you mean it.</h3>
          <p>
            Ask naturally about sales, spend, customers, or whatever is keeping
            you curious.
          </p>
        </article>
        <article className="runway-step">
          <span className="step-index">02 / CONNECT</span>
          <div className="step-icon">
            <Layers3 size={23} />
          </div>
          <h3>Let the tables find each other.</h3>
          <p>
            Schematic understands the relationships across files before it
            reaches a conclusion.
          </p>
        </article>
        <article className="runway-step">
          <span className="step-index">03 / VERIFY</span>
          <div className="step-icon">
            <ShieldCheck size={23} />
          </div>
          <h3>Keep the trail in view.</h3>
          <p>
            Every result comes with its source fields and the SQL behind the
            answer.
          </p>
        </article>
      </div>
      <div className="runway-visual" data-reveal data-reveal-delay="2">
        <DataRail />
        <div className="runway-visual__caption">
          <EvidenceStamp>Source aware</EvidenceStamp>
          <span>Question → source → conclusion</span>
        </div>
      </div>
    </section>
  );
}
