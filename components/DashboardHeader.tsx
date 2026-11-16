"use client";

import { Bell, Search, UserCircle } from "lucide-react";
import SyncStatusBadge from "@/components/SyncStatusBadge";

export default function DashboardHeader() {
  return (
    <header className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
      <div>
        <p className="text-sm text-muted">Welcome back, Administrator</p>
        <h2 className="mt-1 text-xl font-bold text-foreground">
          School Overview
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Offline / Online Sync Indicator */}
        <SyncStatusBadge />

        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Search size={18} className="text-muted" />
          <span className="text-sm text-muted">Search...</span>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-lg border border-border bg-surface p-2 text-muted hover:bg-light-green hover:text-primary transition-colors cursor-pointer"
        >
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-2">
          <UserCircle size={30} className="text-primary" />
          <span className="hidden text-sm font-medium sm:block">
            Administrator
          </span>
        </div>
      </div>
    </header>
  );
}
