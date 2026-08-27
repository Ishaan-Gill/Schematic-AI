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
import { BrandLogo } from "@/components/ui/brand-logo";
import type { StoredDataset } from "@/types/datasets";
import { Session } from "@/types/chat";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { destroyDuckDB } from "@/lib/duckdb/duckdb";

type SidebarProps = {
  datasets: StoredDataset[];
  sessions: Session[];
  activeSessionId: string | null;
  setActiveSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  handleNewChat: () => void;
  onRenameSession?: (sessionId: string, newTitle: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onDeleteDataset: (dataset: StoredDataset) => void;
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isUploading?: boolean;
  user: { email?: string; user_metadata?: Record<string, unknown> } | null;
};

export default function Sidebar({
  datasets,
  sessions,
  activeSessionId,
  setActiveSessionId,
  handleNewChat,
  onRenameSession,
  onDeleteSession,
  onDeleteDataset,
  onFileChange,
  isUploading,
  user,
}: SidebarProps) {
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

    await destroyDuckDB().catch((err) => {
      console.error("DuckDB cleanup failed:", err);
    });

    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[220px] flex-col border-r border-workspace-border-strong bg-workspace-sidebar-bg">
      {/* Logo */}
      <Link href="/" className="block">
        <motion.div
          className="flex items-center gap-2.5 border-b border-workspace-border px-5 py-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <span className="brand">
            <BrandLogo />
          </span>
        </motion.div>
      </Link>

      {/* New Chat Button */}
      <motion.div
        className="px-3 pt-3 pb-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <button
          onClick={handleNewChat}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg",
            "border border-workspace-accent/30",
            "bg-workspace-accent",
            "px-3 py-2.5",
            "text-[13px] font-medium text-white",
            "shadow-[2px_2px_0_rgba(23,32,26,0.12)]",
            "transition-all duration-150",
            "hover:bg-workspace-accent-dark hover:shadow-[3px_3px_0_rgba(23,32,26,0.15)]",
            "hover:translate-x-[-1px] hover:translate-y-[-1px]",
            "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_rgba(23,32,26,0.12)]",
          )}
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>
      </motion.div>

      {/* Recents Label */}
      <motion.div
        className="px-4 pt-4 pb-1.5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <span className="section-label">Recent</span>
      </motion.div>

      {/* Recents List */}
      <div className="space-y-0.5 px-2">
        {sessions.map((session) => (
          <div key={session.id} className="group flex items-center gap-1">
            {renamingSessionId === session.id ? (
              <div className="flex min-w-0 flex-1 items-center rounded-lg bg-workspace-accent-soft px-2.5 py-2">
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
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-workspace-text outline-none"
                />
              </div>
            ) : (
              <button
                onClick={() => setActiveSessionId(session.id)}
                className={cn(
                  "flex min-w-0 flex-1 items-center rounded-lg px-2.5 py-2",
                  "text-left text-[13px]",
                  "transition-all duration-150",
                  activeSessionId === session.id
                    ? "bg-workspace-accent-soft text-workspace-text font-medium border border-workspace-accent/20"
                    : "text-workspace-text-secondary hover:bg-workspace-surface border border-transparent",
                )}
              >
                {activeSessionId === session.id && (
                  <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-workspace-accent" />
                )}
                <span className="truncate">{session.title}</span>
              </button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="shrink-0 rounded p-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-workspace-surface-sunken"
                >
                  <MoreHorizontal className="h-3.5 w-3.5 text-workspace-text-muted" />
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
        className="px-4 pt-4 pb-1.5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <span className="section-label">Datasets</span>
      </motion.div>

      {/* Dataset List */}
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

      {/* Footer */}
      <motion.div
        className="border-t border-workspace-border-strong"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="px-3 py-3">
          <UserMenu user={user} onLogout={handleLogout} />
        </div>
      </motion.div>
    </aside>
  );
}
