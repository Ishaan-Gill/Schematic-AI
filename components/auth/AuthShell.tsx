import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";
import "./auth.css";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell">
      <div className="auth-grid" aria-hidden="true" />
      <header className="auth-topbar">
        <Link href="/" className="brand" aria-label="Schematic AI home">
          <BrandLogo />
        </Link>
        <Link href="/" className="auth-quiet-link">
          Back to home
        </Link>
      </header>
      <div className="auth-main">{children}</div>
    </main>
  );
}
