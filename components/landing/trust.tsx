import { FadeIn } from './fade-in'

export function Trust() {
  const comparisons = [
    {
      title: 'Read-only analysis',
      schematic: {
        icon: (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m7.528-4.528a9 9 0 11-12.656 0M9 10a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        ),
        description: 'Your data is never modified. We only read to generate insights.',
      },
      chatgpt: {
        icon: (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        ),
        text: 'May reinterpret or alter your data context',
      },
    },
    {
      title: 'Transparent SQL',
      schematic: {
        icon: (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v10a2 2 0 002 2h5m4-16h5a2 2 0 012 2v10a2 2 0 01-2 2h-5m-4-4h4m-4 4v4m0-11v4" />
          </svg>
        ),
        description: 'Every answer includes the SQL query so you can verify results.',
      },
      chatgpt: {
        icon: (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
        ),
        text: 'No visibility into how the answer was derived',
      },
    },
    {
      title: 'Review assumptions',
      schematic: {
        icon: (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        ),
        description: 'Examine the data model and field mappings used in analysis.',
      },
      chatgpt: {
        icon: (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        text: 'No way to see what assumptions were made',
      },
    },
    {
      title: 'Delete anytime',
      schematic: {
        icon: (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3H5v2h14V7h-3z" />
          </svg>
        ),
        description: 'Remove your datasets whenever you want. Complete data control.',
      },
      chatgpt: {
        icon: (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        ),
        text: 'No control over how your uploaded data is retained',
      },
    },
  ]

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-4xl md:text-5xl font-bold text-balance leading-tight">
              Not another ChatGPT wrapper
            </h2>
            <p className="text-base md:text-lg text-muted-foreground font-light max-w-2xl mx-auto">
              ChatGPT and Claude can read your CSV — but you can&apos;t check their work.
              Every Schematic answer comes with the exact SQL, so you can verify it
              yourself.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <FadeIn>
            <div className="space-y-4">
              <h3 className="text-center text-lg font-semibold text-muted-foreground mb-6">
                ChatGPT / Claude
              </h3>
              {comparisons.map((item, index) => (
                <div
                  key={index}
                  className="relative bg-card/20 border border-border/20 rounded-xl p-6"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400/60 flex items-center justify-center mb-4">
                    {item.chatgpt.icon}
                  </div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed">
                    {item.chatgpt.text}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.06}>
            <div className="space-y-4">
              <h3 className="text-center text-lg font-semibold text-primary mb-6">
                Schematic
              </h3>
              {comparisons.map((item, index) => (
                <div
                  key={index}
                  className="group relative bg-card/40 border border-border/40 rounded-xl p-6 hover:border-primary/30 hover:bg-card/60 transition-all duration-150"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    {item.schematic.icon}
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.schematic.description}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
