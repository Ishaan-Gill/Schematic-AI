export function BrandLogo() {
  return (
    <>
      <div className="w-6 h-6 bg-primary rounded grid grid-cols-2 gap-0.5 p-1 group-hover:scale-105 transition-transform duration-200">
        <div className="bg-background rounded-sm" />
        <div className="bg-primary rounded-sm" />
        <div className="bg-primary rounded-sm" />
        <div className="bg-background rounded-sm" />
      </div>
      <span className="group-hover:text-primary transition-colors duration-200">
        Schematic.ai
      </span>
    </>
  )
}
