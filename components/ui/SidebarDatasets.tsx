"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StoredDataset } from "@/types/datasets";

type SidebarDatasetsProps = {
  datasets: StoredDataset[];
  onDeleteDataset: (dataset: StoredDataset) => void;
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isUploading?: boolean;
};

export default function SidebarDatasets({
  datasets,
  onDeleteDataset,
  onFileChange,
  isUploading,
}: SidebarDatasetsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-0.5 flex-1 space-y-0.5 overflow-y-auto px-2">
        {datasets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-3 rounded-lg border border-dashed border-workspace-border-strong bg-workspace-surface/50 p-3 text-[11px] leading-5 text-workspace-text-muted"
          >
            Uploaded datasets will appear here.
          </motion.div>
        ) : (
          datasets.map((dataset, i) => (
            <motion.div
              key={dataset.table_name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: i * 0.03,
              }}
            >
              <div className="group flex items-center gap-1">
                <button
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2",
                    "text-workspace-text",
                    "transition-colors duration-150",
                    "hover:bg-workspace-surface",
                  )}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-workspace-accent" />

                  <span className="min-w-0 flex-1 truncate text-left font-mono text-[11px]">
                    {dataset.table_name}
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDataset(dataset);
                  }}
                  className="shrink-0 rounded p-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-workspace-danger-soft"
                >
                  <Trash2 className="h-3.5 w-3.5 text-workspace-danger" />
                </button>
              </div>
            </motion.div>
          ))
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.xlsx"
          onChange={onFileChange}
          disabled={isUploading}
          className="sr-only"
        />

        <motion.button
          onClick={() => {
            if (!isUploading) fileInputRef.current?.click();
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: Math.min(datasets.length * 0.03, 0.2),
          }}
          className={cn(
            "mt-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-2",
            "border border-dashed border-workspace-border-strong",
            "text-[11px] text-workspace-text-muted",
            "transition-all duration-150",
            isUploading
              ? "pointer-events-none opacity-30"
              : "glow-green",
          )}
        >
          <Plus className="h-3 w-3" />

          <span>{isUploading ? "Uploading..." : "Add dataset"}</span>
        </motion.button>
    </div>
  );
}
