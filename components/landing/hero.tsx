"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BrowserWindow } from "./browser-window";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative py-16 md:py-24 lg:py-32 overflow-hidden"
    >
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-primary/5 via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-8 lg:gap-12 items-start lg:items-center">
          {/* Left side - Content */}
          <div className="space-y-6 md:space-y-8 pt-0 lg:pt-8">
            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-balance tracking-tight">
                Ask questions about your{" "}
                <span className="text-primary">data</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg font-light">
                Get verified answers from your business data, not AI guesses.
                Every result comes with the exact SQL used to generate it.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/signup"
                className="group flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 md:px-8 md:py-4"
              >
                Start Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 pt-6 border-t border-border/30">
              <p className="text-sm text-muted-foreground">
                Built for{" "}
                <span className="font-medium text-foreground">CSVs</span> &
                multi-table{" "}
                <span className="font-medium text-foreground">Excel</span>{" "}
                files.
              </p>
            </div>
          </div>

          {/* Right side - Browser window with demo */}
          <div className="relative w-full aspect-[1.9/1] lg:aspect-[1.6/1] min-h-[330px]">
            <BrowserWindow>
              <Image
                src="/images/schematic-dashboard.png"
                alt="Schematic dashboard"
                fill
                priority
                className="object-cover rounded-b-xl"
              />
            </BrowserWindow>
          </div>
        </div>
      </div>
    </section>
  );
}
