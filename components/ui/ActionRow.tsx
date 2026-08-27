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
    <div style={{ display: "flex", flexShrink: 0, alignItems: "center" }}>
      <button
        onClick={handleExport}
        disabled={isExporting}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          flexShrink: 0,
          borderRadius: "8px",
          background: "#157347",
          color: "#ffffff",
          padding: "6px 14px",
          fontSize: "11px",
          fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
          fontWeight: 600,
          border: "none",
          boxShadow: "2px 2px 0 rgba(21,115,71,0.25)",
          cursor: isExporting ? "not-allowed" : "pointer",
          opacity: isExporting ? 0.4 : 1,
          transition: "all 150ms",
        }}
        onMouseEnter={(e) => {
          if (!isExporting) {
            e.currentTarget.style.background = "#0e5735";
            e.currentTarget.style.boxShadow = "3px 3px 0 rgba(21,115,71,0.3)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#157347";
          e.currentTarget.style.boxShadow = "2px 2px 0 rgba(21,115,71,0.25)";
        }}
      >
        {isExporting ? "Exporting..." : "\u2193 Export CSV"}
      </button>
    </div>
  );
}
