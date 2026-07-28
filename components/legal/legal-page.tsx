import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated: string
  children: React.ReactNode
}) {
  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <div className="container mx-auto px-4 relative z-10 py-24 md:py-32">
        <div className="max-w-3xl mx-auto">
          <div className="mb-16 space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-balance leading-tight">
              {title}
            </h1>
            <p className="text-base text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="space-y-12">
            {children}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

export function LegalSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground">
        {title}
      </h2>
      <div className="text-base text-muted-foreground leading-relaxed space-y-4">
        {children}
      </div>
    </section>
  )
}
