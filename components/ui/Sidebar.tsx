"use client";

import { useEffect, useRef, useState } from "react";
import React from "react";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import UserMenu from "@/components/ui/UserMenu";
import { datasetMemory } from "@/lib/upload/metadata/datasetMemory";
import type { StoredDataset } from "@/types/datasets";
import { Relationship } from "@/lib/ai/context/relationships";
import { Session } from "@/types/chat";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { destroyDuckDB } from "@/lib/duckdb/duckdb";

type SidebarProps = {
  datasets: StoredDataset[];
  relationships: Relationship[];
  sessions: Session[];
  activeSessionId: string | null;
  setActiveSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  handleNewChat: () => void;
  onRenameSession?: (sessionId: string, newTitle: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onDeleteDataset: (dataset: StoredDataset) => void;
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  user: { email?: string; user_metadata?: Record<string, unknown> } | null;
};

export default function Sidebar({
  datasets,
  relationships,
  sessions,
  activeSessionId,
  setActiveSessionId,
  handleNewChat,
  onRenameSession,
  onDeleteSession,
  onDeleteDataset,
  onFileChange,
  user,
}: SidebarProps) {
  const warningsCount = Object.values(datasetMemory).reduce(
    (total, dataset) =>
      total +
      Object.values(dataset.profile).filter((col) => col.nullPercentage >= 25)
        .length,
    0,
  );

  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingSessionId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingSessionId]);

  const saveRename = (sessionId: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenamingSessionId(null);
      return;
    }
    onRenameSession?.(sessionId, trimmed);
    setRenamingSessionId(null);
  };

  const cancelRename = () => {
    setRenamingSessionId(null);
  };

  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(error);
      return;
    }

    await destroyDuckDB();

    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[220px] flex-col border-r border-[#1c1e24] bg-[#0a0b0e]">
      {/* Logo */}
      <motion.div
        className="flex items-center gap-2.5 px-5 py-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="grid h-7 w-7 grid-cols-2 grid-rows-2 gap-1 rounded-[6px] border-[1.5px] border-[#4fffb0] p-1">
          <div className="rounded-[2px] bg-[#4fffb0]" />
          <div className="rounded-[2px] bg-[#4fffb0]/60" />
          <div className="rounded-[2px] bg-[#4fffb0]/40" />
          <div className="rounded-[2px] bg-[#4fffb0]/20" />
        </div>

        <span className="font-sans text-[15px] font-medium text-[#e8eaf0]">
          Schematic<span className="text-[#4fffb0]">.ai</span>
        </span>
      </motion.div>

      {/* New Chat Button */}
      <motion.div
        className="px-3 pt-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <button
          onClick={handleNewChat}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg",
            "border border-[#2a2d35]",
            "bg-[#111215]",
            "px-3 py-2.5",
            "font-sans text-[13px] font-medium text-[#e8eaf0]",
            "transition-all duration-200",
            "hover:border-[#4fffb0]",
            "hover:bg-[#15171c]",
          )}
        >
          <Plus className="h-4 w-4 text-[#4fffb0]" />
          <span>New Chat</span>
        </button>
      </motion.div>

      {/* Recents Label */}
      <motion.div
        className="px-5 pt-6 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <span className="section-label">Recent</span>
      </motion.div>

      {/* Recents List */}
      <div className="space-y-1 px-2">
        {sessions.map((session) => (
          <div key={session.id} className="group flex items-center gap-2">
            {renamingSessionId === session.id ? (
              <div className="flex min-w-0 flex-1 items-center rounded-lg bg-[#1b1d22] px-3 py-2">
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => saveRename(session.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveRename(session.id);
                    }
                    if (e.key === "Escape") {
                      cancelRename();
                    }
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none"
                />
              </div>
            ) : (
              <button
                onClick={() => setActiveSessionId(session.id)}
                className={cn(
                  "flex min-w-0 flex-1 rounded-lg px-3 py-2",
                  "text-left text-[13px]",
                  "transition-colors",
                  activeSessionId === session.id
                    ? "bg-[#1b1d22] text-white"
                    : "text-[#b6bcc8] hover:bg-[#111215]",
                )}
              >
                <span className="truncate">{session.title}</span>
              </button>
            )}

              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="shrink-0 rounded p-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-[#1b1d22]"
                >
                  <MoreHorizontal className="h-4 w-4 text-[#6b7280]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <DropdownMenuItem
                  onSelect={() => {
                    setRenamingSessionId(session.id);
                    setRenameValue(session.title);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDeleteSession?.(session.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Datasets Label */}
      <motion.div
        className="px-5 pt-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <span className="section-label">Datasets</span>
      </motion.div>

      {/* Dataset List */}
      <div className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-2">
        {datasets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-3 rounded-[6px] border border-dashed border-[#2a2d35] bg-transparent p-4 font-sans text-[12px] leading-5 text-[#6b7280]"
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
              <div className="group flex items-center gap-2">
                <button
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2",
                    "font-mono text-[11px] text-[#e8eaf0]",
                    "transition-colors duration-150",
                    "hover:bg-[#111215]",
                  )}
                >
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-[#6b7280]" />

                  <span className="min-w-0 flex-1 truncate text-left">
                    {dataset.table_name}
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDataset(dataset);
                  }}
                  className="shrink-0 rounded p-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-[#1b1d22]"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
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
          className="sr-only"
        />

        <motion.button
          onClick={() => fileInputRef.current?.click()}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: Math.min(datasets.length * 0.03, 0.2),
          }}
          className={cn(
            "mt-3 flex w-full items-center gap-2 rounded-[6px] px-3 py-2",
            "border border-dashed border-[#2a2d35]",
            "font-mono text-[10px] text-[#6b7280]",
            "transition-all duration-200",
            "hover:border-[#4fffb0] hover:bg-[rgba(79,255,176,0.02)] hover:text-[#4fffb0]",
          )}
        >
          <Plus className="h-3.5 w-3.5" />

          <span>Add dataset</span>
        </motion.button>
      </div>

      {/* Footer */}
      <motion.div
        className="border-t border-[#1c1e24]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col gap-1 px-3 py-2 font-mono text-[9px] text-[#374151]">
          <span className="flex items-center gap-1">
            <span className="h-[5px] w-[5px] rounded-full bg-[#4fffb0]" />
            {datasets.length} datasets
          </span>
          <span className="flex items-center gap-1">
            <span className="h-[5px] w-[5px] rounded-full bg-[#38bdf8]" />
            {relationships.length} joins
          </span>
          <span className="flex items-center gap-1">
            <span className="h-[5px] w-[5px] rounded-full bg-[#f59e0b]" />
            {warningsCount} warnings
          </span>
        </div>

        <div className="border-t border-[#1c1e24] px-3 py-3">
          <UserMenu user={user} onLogout={handleLogout} />
        </div>
      </motion.div>
    </aside>
  );
}
