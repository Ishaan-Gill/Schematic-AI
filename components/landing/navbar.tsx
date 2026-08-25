"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight, Sparkles } from "lucide-react";
import { AnchorLink, Brand } from "./landing-shared";

export function Navbar() {
  return (
    <>
      <div className="ticker" aria-label="Product announcement">
        <span>
          <Sparkles size={13} /> Now in open beta
        </span>
        <span className="ticker__rule" />
        <span>Ask a business question. Keep the evidence.</span>
        <AnchorLink id="method">
          See how it works <ArrowRight size={13} />
        </AnchorLink>
      </div>
      <header className="topbar">
        <Brand />
        <nav aria-label="Primary navigation">
          <AnchorLink id="method">Method</AnchorLink>
          <AnchorLink id="proof">Proof</AnchorLink>
          <AnchorLink id="questions">Questions</AnchorLink>
        </nav>
        <div className="topbar__auth">
          <Link href="/login">Log in</Link>
          <Link className="topbar__cta" href="/signup">
            Start with a spreadsheet <ArrowDownRight size={15} />
          </Link>
        </div>
      </header>
    </>
  );
}
