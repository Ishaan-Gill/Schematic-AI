'use client'

import Link from 'next/link'
import { BrandLogo } from '@/components/ui/brand-logo'

const navLinks = [
  { label: 'Examples', id: 'examples' },
  { label: 'Features', id: 'features' },
  { label: 'FAQ', id: 'faq' },
]

export function LegalHeader() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg group cursor-pointer"
        >
          <BrandLogo />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              className="relative text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group cursor-pointer"
            >
              <span className="relative">
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="group relative overflow-hidden rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-all duration-300 hover:shadow-lg hover:shadow-primary/30"
          >
            <span className="relative z-10">Start Free</span>
            <span className="absolute inset-0 origin-left scale-x-0 bg-primary/80 transition-transform duration-300 group-hover:scale-x-100" />
          </Link>
        </div>
      </div>
    </nav>
  )
}
