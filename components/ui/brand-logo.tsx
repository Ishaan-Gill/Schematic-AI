export function BrandLogo() {
  return (
    <>
      <div className="grid h-7 w-7 grid-cols-2 grid-rows-2 gap-1 rounded-[6px] border-[1.5px] border-workspace-border-strong p-1">
        <div className="rounded-[2px] bg-workspace-accent" />
        <div className="rounded-[2px] bg-workspace-accent/60" />
        <div className="rounded-[2px] bg-workspace-accent/40" />
        <div className="rounded-[2px] bg-workspace-accent/20" />
      </div>

      <span className="font-sans text-[24px] font-medium text-workspace-text">
        Schematic<span className="text-workspace-accent"> AI</span>
      </span>
    </>
  )
}
