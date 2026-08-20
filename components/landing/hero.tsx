"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BrowserWindow } from "./browser-window";

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function Hero() {
  return (
    <section
      id="hero"
      className="relative py-20 md:py-28 lg:py-36 overflow-hidden"
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-8 lg:gap-12 items-start lg:items-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-6 md:space-y-8 pt-0 lg:pt-8"
          >
            <motion.div variants={fadeUp} className="space-y-3">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-balance tracking-tight">
                Ask questions about your{" "}
                <span className="text-primary">data</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg font-light">
                Get verified answers from your business data, not AI guesses.
                Every result comes with the exact SQL used to generate it.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/signup"
                className="group flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 md:px-8 md:py-4"
              >
                Start Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-center gap-4 pt-6 border-t border-border/30">
              <p className="text-sm text-muted-foreground">
                Built for{" "}
                <span className="font-medium text-foreground">CSVs</span> &
                multi-table{" "}
                <span className="font-medium text-foreground">Excel</span>{" "}
                files.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full aspect-[1.9/1] lg:aspect-[1.6/1] min-h-[330px]"
          >
            <BrowserWindow>
              <Image
                src="/images/schematic-dashboard.png"
                alt="Schematic dashboard showing SQL query and results"
                fill
                priority
                className="object-cover rounded-b-xl"
              />
            </BrowserWindow>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
