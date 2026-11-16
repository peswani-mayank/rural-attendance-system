"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import {
  ClipboardCheck,
  Camera,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  Eye,
  X,
} from "lucide-react";
import { offlineDb, OfflineAttendanceRecord, OfflineClass } from "@/lib/offlineDb";
import { syncPendingAttendance } from "@/lib/syncService";

export default function AttendanceHistoryPage() {
  const [sessions, setSessions] = useState<OfflineAttendanceRecord[]>([]);
  const [classes, setClasses] = useState<OfflineClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchDate, setSearchDate] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeSessionModal, setActiveSessionModal] = useState<OfflineAttendanceRecord | null>(null);

  async function loadSessions() {
    try {
      const records = await offlineDb.attendanceQueue
        .orderBy("createdAt")
        .reverse()
        .toArray();
      setSessions(records);

      const cls = await offlineDb.classes.toArray();
      setClasses(cls);
    } catch (err) {
      console.error("Error loading attendance history:", err);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function handleManualSync() {
    setIsSyncing(true);
    await syncPendingAttendance();
    await loadSessions();
    setIsSyncing(false);
  }

  const filteredSessions = sessions.filter((s) => {
    const matchesClass = selectedClass === "all" || s.classId === selectedClass;
    const matchesDate = !searchDate || s.date.includes(searchDate);
    return matchesClass && matchesDate;
  });

  const pendingCount = sessions.filter((s) => !s.synced).length;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="min-w-0 flex-1 p-6 md:p-8">
        <DashboardHeader />

        {/* Page Title & Actions */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardCheck className="text-primary" size={26} />
              Attendance Sessions & History
            </h1>
            <p className="mt-1 text-sm text-muted">
              Review classroom records, check synchronization status, and verify past student attendance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:bg-light-green hover:text-primary transition shadow-xs cursor-pointer"
              >
                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                <span>Sync {pendingCount} Offline Records</span>
              </button>
            )}

            <Link
              href="/admin/attendance/capture"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
            >
              <Camera size={16} />
              <span>Take Attendance</span>
            </Link>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
              >
                <option value="all">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.section})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-muted" />
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                placeholder="Filter date"
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
              />
              {searchDate && (
                <button
                  onClick={() => setSearchDate("")}
                  className="text-xs text-muted hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="text-xs text-muted">
            Showing <span className="font-bold text-foreground">{filteredSessions.length}</span> recorded sessions
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="border-b border-border bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Class & Section</th>
                  <th className="px-5 py-3.5">Attendance Summary</th>
                  <th className="px-5 py-3.5">Recorded By</th>
                  <th className="px-5 py-3.5">Storage / Sync</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => {
                    const total = session.totalPresent + session.totalAbsent;
                    const percent = total > 0 ? Math.round((session.totalPresent / total) * 100) : 0;

                    return (
                      <tr key={session.sessionId} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-4 font-medium text-foreground">
                          {session.date}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-foreground">
                            {session.className}
                          </span>
                          <span className="ml-1 text-xs text-muted">
                            (Sec {session.section})
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-emerald-700">
                              {session.totalPresent} Present
                            </span>
                            <span className="text-xs text-red-600">
                              {session.totalAbsent} Absent
                            </span>
                            <span className="text-[11px] font-mono text-muted bg-slate-100 px-1.5 py-0.5 rounded">
                              {percent}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted">
                          {session.takenBy}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              session.synced
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {session.synced ? (
                              <>
                                <CheckCircle2 size={12} /> Synced to Server
                              </>
                            ) : (
                              <>
                                <Clock size={12} /> Local Offline Queue
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setActiveSessionModal(session)}
                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-primary hover:bg-light-green transition cursor-pointer"
                          >
                            <Eye size={13} /> View Roster
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted">
                      <Users size={32} className="mx-auto mb-2 opacity-30 text-primary" />
                      <p className="font-medium text-foreground">No Attendance Sessions Found</p>
                      <p className="text-xs text-muted mt-1">
                        Capture a new session using the AI Attendance Capture button above.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: View Session Details */}
        {activeSessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-xl border border-border flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Attendance Roster: {activeSessionModal.className} (Sec {activeSessionModal.section})
                  </h3>
                  <p className="text-xs text-muted">
                    Session Date: {activeSessionModal.date} • Recorded by: {activeSessionModal.takenBy}
                  </p>
                </div>
                <button
                  onClick={() => setActiveSessionModal(null)}
                  className="rounded-lg p-1 text-muted hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Roster list */}
              <div className="mt-4 flex-1 overflow-y-auto divide-y divide-border">
                {activeSessionModal.records.map((st) => (
                  <div key={st.studentId} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-semibold text-muted mr-2">
                        #{st.rollNumber}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {st.studentName}
                      </span>
                      {st.confidence && (
                        <span className="ml-2 text-[11px] text-emerald-700">
                          (Match: {Math.round(st.confidence * 100)}%)
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        st.status === "present"
                          ? "bg-emerald-100 text-emerald-800"
                          : st.status === "absent"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {st.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-muted">
                <span>
                  Total: {activeSessionModal.totalPresent} Present, {activeSessionModal.totalAbsent} Absent
                </span>
                <button
                  onClick={() => setActiveSessionModal(null)}
                  className="rounded-lg bg-slate-100 px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-slate-200 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

