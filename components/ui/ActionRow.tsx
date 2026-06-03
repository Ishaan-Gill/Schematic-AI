type ActionRowProps = {
    onExport: () => void
}

export default function ActionRow({
    onExport
}: ActionRowProps) {
    return (
        <div className="flex items-center gap-2">
            <button disabled className="flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] text-[#6b7280] transition hover:text-[#4fffb0]">
                ✓ Verify
            </button>

            <button onClick={onExport} className="flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] text-[#6b7280] transition hover:text-[#4fffb0]">
                ↓ Export
            </button>

            <button disabled className="flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] text-[#6b7280] transition hover:text-[#4fffb0]">
                📌 Save
            </button>

            <button disabled className="flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] text-[#6b7280] transition hover:text-[#4fffb0]">
                📊 Chart
            </button>
        </div>
    )
}