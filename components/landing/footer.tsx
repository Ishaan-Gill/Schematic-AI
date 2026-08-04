import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-card/20 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 mb-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <div className="grid h-6 w-6 grid-cols-2 gap-0.5 rounded bg-primary p-1">
                <div className="rounded-sm bg-background" />
                <div className="rounded-sm bg-primary" />
                <div className="rounded-sm bg-primary" />
                <div className="rounded-sm bg-background" />
              </div>
              <span>Schematic AI</span>
            </div>

            <p className="text-sm text-muted-foreground leading-6">
              Upload spreadsheets. Ask questions.
              <br />
              Get trustworthy business answers.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Product
            </h3>

            <ul className="space-y-2">
              <li>
                <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>

              <li>
                <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  How it works
                </Link>
              </li>

              <li>
                <Link href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>

              <li>
                <Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Start Free
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Resources
            </h3>

            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Connect
            </h3>

            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:getschematicai@gmail.com"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  getschematicai@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/30 pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Schematic AI. All rights reserved.
          </p>

          <p className="text-sm text-muted-foreground">
            Built for founders and small teams.
          </p>
        </div>
      </div>
    </footer>
  );
}