"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Session } from "@/types/chat";

type SidebarSessionsProps = {
  sessions: Session[];
  activeSessionId: string | null;
  setActiveSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  onRenameSession?: (sessionId: string, newTitle: string) => void;
  onDeleteSession?: (sessionId: string) => void;
};

export default function SidebarSessions({
  sessions,
  activeSessionId,
  setActiveSessionId,
  onRenameSession,
  onDeleteSession,
}: SidebarSessionsProps) {
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

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

  return (
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
  );
}
