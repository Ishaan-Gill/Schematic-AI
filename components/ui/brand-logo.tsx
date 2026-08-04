export function BrandLogo() {
  return (
    <>
      <div className="grid h-7 w-7 grid-cols-2 grid-rows-2 gap-1 rounded-[6px] border-[1.5px] border-[#4fffb0] p-1">
        <div className="rounded-[2px] bg-[#4fffb0]" />
        <div className="rounded-[2px] bg-[#4fffb0]/60" />
        <div className="rounded-[2px] bg-[#4fffb0]/40" />
        <div className="rounded-[2px] bg-[#4fffb0]/20" />
      </div>

      <span className="font-sans text-[24px] font-medium text-[#e8eaf0]">
        Schematic<span className="text-[#4fffb0]"> AI</span>
      </span>
    </>
  )
}
