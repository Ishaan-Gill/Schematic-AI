"use client";

import { useEffect, useState } from "react";
import { CreditCard, LogOut, Settings } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  user: {
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null;
  onLogout: () => void;
};

type QuotaData = {
  used: number;
  limit: number;
  resetsAt: string;
};

function formatResetRemaining(isoString: string): string {
  const diffMs = new Date(isoString).getTime() - Date.now();
  if (diffMs <= 0) return "Resets now";
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `Resets in ${hours}h ${minutes}m`;
  return `Resets in ${minutes}m`;
}

function getDisplayName(user: UserMenuProps["user"]): string {
  if (!user) return "User";
  const meta = user.user_metadata;
  if (meta && typeof meta.full_name === "string" && meta.full_name.trim()) {
    return meta.full_name;
  }
  return user.email?.split("@")[0] ?? "User";
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const initial = user?.email?.charAt(0).toUpperCase() ?? "?";
  const displayName = getDisplayName(user);
  const [quota, setQuota] = useState<QuotaData | null>(null);

  useEffect(() => {
    fetch("/api/usage/quota")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch quota");
        return res.json();
      })
      .then((data) => setQuota(data))
      .catch(() => {});
  }, []);

  const progressPct = quota
    ? Math.min((quota.used / quota.limit) * 100, 100)
    : 0;
  const remaining = quota ? Math.max(quota.limit - quota.used, 0) : 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-workspace-accent/25 bg-workspace-accent/10 text-[12px] font-semibold text-workspace-accent shadow-[1px_1px_0_rgba(21,115,71,0.10)] transition-all duration-150 hover:border-workspace-accent/40 hover:bg-workspace-accent/15">
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="start"
        className="w-[336px] p-1.5"
      >
        <div className="flex items-center gap-4 px-4 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-workspace-accent/25 bg-workspace-accent/10 text-[18px] font-semibold text-workspace-accent">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[16px] font-semibold text-workspace-text">
              {displayName}
            </div>
            {user?.email && (
              <div className="truncate text-[13px] text-workspace-text-secondary">
                {user.email}
              </div>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="px-4 py-3">
          <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-workspace-text-secondary">
            Daily quota
          </div>
          <div className="h-[6px] w-full overflow-hidden rounded-full bg-workspace-border">
            <div
              className="h-full rounded-full bg-workspace-accent transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[15px] font-medium text-workspace-text">
              {quota ? `${quota.used} / ${quota.limit}` : "\u2014"}
            </span>
            <span className="text-[13px] text-workspace-text-muted">queries</span>
          </div>
          {quota && (
            <div className="mt-0.5 space-y-0.5">
              <p className="text-[13px] text-workspace-text-secondary">
                {remaining} remaining
              </p>
              <p className="font-mono text-[11px] text-workspace-text-muted">
                {formatResetRemaining(quota.resetsAt)}
              </p>
            </div>
          )}
          {!quota && (
            <p className="mt-1 text-[13px] text-workspace-text-muted">Loading...</p>
          )}
        </div>

        <DropdownMenuSeparator />

        <div className="px-1">
          <DropdownMenuItem disabled className="text-workspace-text-muted opacity-100 data-disabled:opacity-100">
            <Settings className="h-4 w-4 text-workspace-text-muted" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="text-workspace-text-muted opacity-100 data-disabled:opacity-100">
            <CreditCard className="h-4 w-4 text-workspace-text-muted" />
            Billing
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="mt-1.5" />

        <DropdownMenuItem onSelect={onLogout} variant="destructive">
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
