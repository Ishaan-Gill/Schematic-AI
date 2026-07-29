import { useState } from "react";

type ActionRowProps = {
  onExport: () => Promise<void>;
};

export default function ActionRow({ onExport }: ActionRowProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Comment in when add their functionality */}
      {/* <button disabled className="flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] text-[#6b7280] transition hover:text-[#4fffb0]">
                ✓ Verify
            </button> */}

      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center gap-2 rounded-md border border-[#4fffb0]/30 px-4 py-2 text-sm font-medium text-[#4fffb0] transition-all hover:border-[#4fffb0] hover:bg-[#4fffb0]/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isExporting ? "Exporting..." : "↓ Export CSV"}
      </button>

      {/* <button disabled className="flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] text-[#6b7280] transition hover:text-[#4fffb0]">
                📌 Save
            </button>

            <button disabled className="flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] text-[#6b7280] transition hover:text-[#4fffb0]">
                📊 Chart
            </button> */}
    </div>
  );
}
