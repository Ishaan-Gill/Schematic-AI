"use client";

import { CircleCheck, Code2, FileSpreadsheet, Search } from "lucide-react";
import { useReveal } from "./landing-shared";

function SourceMatrix() {
  return (
    <div
      className="source-matrix"
      aria-label="Data source table and generated SQL evidence"
    >
      <div className="source-matrix__sheet">
        <header>
          <span>orders.csv</span>
          <b>linked</b>
        </header>
        <div>
          <span>PRODUCT</span>
          <span>REVENUE</span>
          <span>REPEAT</span>
        </div>
        <div>
          <span>Core</span>
          <span>$84,320</span>
          <b>42.1%</b>
        </div>
        <div>
          <span>Plus</span>
          <span>$62,105</span>
          <b>38.4%</b>
        </div>
        <div>
          <span>Starter</span>
          <span>$41,890</span>
          <b>19.8%</b>
        </div>
      </div>
      <div className="source-matrix__sql">
        <header>
          <span>generated.sql</span>
          <span>read-only</span>
        </header>
        <pre>{`SELECT product,
  SUM(revenue) AS revenue,
  repeat_rate
FROM orders
WHERE quarter = 'Q3'
GROUP BY product;`}</pre>
        <footer>
          <CircleCheck size={12} /> 2 source tables joined
        </footer>
      </div>
    </div>
  );
}

export function Trust() {
  const ref = useReveal<HTMLElement>();

  return (
    <section id="proof" ref={ref} className="proof-section">
      <div className="proof-section__visual" data-reveal>
        <div className="proof-section__label">Source perspective</div>
        <SourceMatrix />
        <span className="proof-section__stamp">
          02
          <br />
          linked tables
        </span>
      </div>
      <div className="proof-section__content" data-reveal data-reveal-delay="1">
        <p className="kicker">
          <span>04</span> Trust is not a feature toggle
        </p>
        <h2>
          Every conclusion
          <br />
          keeps its <i>receipts.</i>
        </h2>
        <p className="proof-section__lede">
          Most AI tools leave you with an answer and a feeling. Schematic leaves
          you with the answer, the query, the source context, and the ability to
          see if the logic holds.
        </p>
        <dl className="proof-list">
          <div>
            <dt>
              <FileSpreadsheet size={18} /> Read-only analysis
            </dt>
            <dd>Your uploaded data remains unchanged.</dd>
          </div>
          <div>
            <dt>
              <Code2 size={18} /> Transparent SQL
            </dt>
            <dd>Inspect exactly how the result was produced.</dd>
          </div>
          <div>
            <dt>
              <Search size={18} /> Review assumptions
            </dt>
            <dd>Understand the fields and model that informed it.</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
