"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

import UserMenu from "@/components/ui/UserMenu";
import SidebarSessions from "@/components/ui/SidebarSessions";
import SidebarDatasets from "@/components/ui/SidebarDatasets";
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
      <SidebarSessions
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        onRenameSession={onRenameSession}
        onDeleteSession={onDeleteSession}
      />

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
      <SidebarDatasets
        datasets={datasets}
        onDeleteDataset={onDeleteDataset}
        onFileChange={onFileChange}
        isUploading={isUploading}
      />

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
