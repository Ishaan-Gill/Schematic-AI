"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, Lock, MoveUpRight } from "lucide-react";
import { AnchorLink } from "./landing-shared";

function ProductFrame() {
  return (
    <div className="hero-product__frame">
      <div className="frame-top">
        <div className="frame-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="frame-url" aria-hidden="true">
          <Lock size={11} />
          <span>getschematicai.com/workspace</span>
        </div>
      </div>
      <div className="frame-shot">
        <Image
          src="/images/schematic-dashboard.png"
          alt="Schematic AI workspace answering Meta Ads spend versus Shopify revenue for Q1 2024 with verified SQL results"
          width={1926}
          height={1280}
          priority
          sizes="(max-width: 860px) 100vw, 58vw"
        />
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
