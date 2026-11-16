"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { offlineDb } from "@/lib/offlineDb";
import { initializeOfflineDatabase, syncPendingAttendance } from "@/lib/syncService";

export default function SyncStatusBadge() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  async function checkPendingRecords() {
    try {
      const count = await offlineDb.attendanceQueue
        .filter((item) => !item.synced)
        .count();
      setPendingCount(count);
    } catch {
      // IndexedDB might not be ready yet
    }
  }

  useEffect(() => {
    // Initial setup
    setIsOnline(navigator.onLine);
    initializeOfflineDatabase();
    checkPendingRecords();

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when network reconnects
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(checkPendingRecords, 4000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  async function handleSync() {
    setIsSyncing(true);
    setNotification(null);

    const result = await syncPendingAttendance();
    await checkPendingRecords();
    setIsSyncing(false);

    if (result.syncedCount > 0) {
      setNotification(result.message);
      setTimeout(() => setNotification(null), 5000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Network Connectivity Badge */}
      <div
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          isOnline
            ? "bg-green-100 text-green-800"
            : "bg-amber-100 text-amber-800"
        }`}
      >
        {isOnline ? (
          <>
            <Wifi size={14} className="text-green-600" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff size={14} className="text-amber-600" />
            <span>Offline Mode</span>
          </>
        )}
      </div>

      {/* Sync Pending Queue Badge */}
      {pendingCount > 0 ? (
        <button
          onClick={handleSync}
          disabled={!isOnline || isSyncing}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
            isOnline
              ? "bg-primary text-white hover:bg-emerald-800 shadow-xs cursor-pointer"
              : "bg-gray-200 text-gray-700 cursor-not-allowed"
          }`}
          title={isOnline ? "Click to synchronize pending records" : "Sync will occur when connection returns"}
        >
          <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
          <span>{pendingCount} Pending Sync</span>
        </button>
      ) : (
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted">
          <CheckCircle2 size={14} className="text-emerald-600" />
          <span>All Synced</span>
        </div>
      )}

      {notification && (
        <span className="hidden md:inline-block text-xs font-medium text-emerald-700 animate-fade-in">
          {notification}
        </span>
      )}
    </div>
  );
}

