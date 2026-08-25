"use client";

import { useEffect, useRef, type ReactNode, type MouseEvent } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";

export function Brand() {
  return (
    <a
      className="brand"
      href="#top"
      aria-label="Schematic AI home"
      onClick={(event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      <BrandLogo />
    </a>
  );
}

export function EvidenceStamp({ children }: { children: ReactNode }) {
  return (
    <span className="evidence-stamp">
      <span className="evidence-stamp__dot" />
      {children}
    </span>
  );
}

export function AnchorLink({
  id,
  className,
  children,
  ariaLabel,
}: {
  id: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <a href={`#${id}`} className={className} aria-label={ariaLabel} onClick={handleClick}>
      {children}
    </a>
  );
}

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.14 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return ref;
}
