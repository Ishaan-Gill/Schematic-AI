"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight, Check, MoveUpRight } from "lucide-react";
import { AnchorLink } from "./landing-shared";

function ProductFrame() {
  return (
    <div
      className="hero-product__frame"
      aria-label="Schematic AI product interface example"
    >
      <div className="frame-top">
        <span />
        <span />
        <span />
        <em>schematic / analysis</em>
        <b>VERIFIED</b>
      </div>
      <div className="frame-body">
        <div className="frame-sidebar" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="frame-answer">
          <div className="frame-prompt">
            Which products stayed profitable as acquisition cost increased?
          </div>
          <div className="frame-response">
            <i>
              <Check size={13} />
            </i>
            <p>
              Three product lines held margin through the rise in acquisition
              cost. The shift was driven by repeat purchase—not discounting.
            </p>
          </div>
          <div className="frame-evidence">
            <span>02 sources linked</span>
            <span>View SQL</span>
            <span>94% confidence</span>
          </div>
          <div className="frame-bars" aria-label="Profitability chart">
            <b />
            <b />
            <b />
            <b />
            <b />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero-shell">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-copy hero-animate">
        <p className="kicker">
          <span>01</span> A conversation with your business
        </p>
        <h1>
          Ask the question
          <br />
          you&rsquo;ve been <i>carrying.</i>
        </h1>
        <p className="hero-copy__lede">
          Schematic turns the spreadsheets behind your business into an answer
          you can follow—from the plain-language question to the source rows
          underneath it.
        </p>
        <div className="hero-copy__actions">
          <Link className="signal-button" href="/signup">
            Trace your first answer <ArrowRight size={18} />
          </Link>
          <AnchorLink id="method" className="quiet-link">
            Explore the method <MoveUpRight size={15} />
          </AnchorLink>
        </div>
      </div>
      <div className="hero-product product-enter">
        <ProductFrame />
      </div>
      <div className="hero-meta">
        <div className="hero-notes">
          <aside className="hero-side-note">
            <span className="side-note__number">A</span>
            <p>
              Plain language in.
              <br />
              <b>Traceable insight out.</b>
            </p>
          </aside>
          <aside className="hero-side-note">
            <span className="side-note__number">B</span>
            <p>
              Answers remain
              <br />
              <b>connected to source.</b>
            </p>
          </aside>
        </div>
        <div className="hero-footnote">
          <span>Business data, not model memory.</span>
          <span>
            Scroll to follow the proof <ArrowDownRight size={15} />
          </span>
        </div>
      </div>
    </section>
  );
}
