"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Clock, ArrowRight } from "lucide-react";
import { offlineDb, OfflineAttendanceRecord } from "@/lib/offlineDb";
import { useLanguage } from "@/lib/languageContext";

export default function RecentAttendance() {
  const { language, t } = useLanguage();
  const [recentRecords, setRecentRecords] = useState<OfflineAttendanceRecord[]>([]);

  useEffect(() => {
    async function loadRecords() {
      try {
        const records = await offlineDb.attendanceQueue
          .orderBy("createdAt")
          .reverse()
          .limit(5)
          .toArray();
        setRecentRecords(records);
      } catch (err) {
        console.error("Failed to load attendance records:", err);
      }
    }
    loadRecords();
  }, []);

  return (
    <div className="w-full min-w-0 rounded-xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {t.recentAttendance}
            </h2>
            <p className="text-xs text-muted">
              {language === "hi"
                ? "दर्ज किए गए नवीनतम कक्षा सत्र"
                : "Latest classroom sessions recorded"}
            </p>
          </div>

          <Link
            href="/admin/attendance/capture"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors shadow-xs"
          >
            <Camera size={14} />
            <span>{t.markWithAI}</span>
          </Link>
        </div>

        {recentRecords.length > 0 ? (
          <div className="divide-y divide-border">
            {recentRecords.map((item, idx) => (
              <div key={item.sessionId || idx} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {item.className} ({language === "hi" ? "वर्ग" : "Sec"} {item.section})
                  </h4>
                  <p className="text-xs text-muted flex items-center gap-2 mt-0.5">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span>
                      {language === "hi" ? "द्वारा" : "By"}: {item.takenBy}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-emerald-700">
                      {item.totalPresent} {t.present}
                    </p>
                    <p className="text-[11px] font-medium text-red-600">
                      {item.totalAbsent} {t.absent}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.synced
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.synced
                      ? (language === "hi" ? "सिंक हुआ" : "Synced")
                      : (language === "hi" ? "ऑफ़लाइन" : "Offline")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-light-green text-primary mb-3">
              <Camera size={22} />
            </div>
            <h4 className="text-sm font-medium text-foreground">
              {language === "hi"
                ? "आज कोई उपस्थिति सत्र दर्ज नहीं हुआ"
                : "No Attendance Sessions Yet Today"}
            </h4>
            <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
              {language === "hi"
                ? "एआई-सत्यापित उपस्थिति लेने के लिए कक्षा की तस्वीर खींचें या अपलोड करें।"
                : "Start by capturing a classroom photo or selecting a class to test AI-assisted attendance."}
            </p>
            <Link
              href="/admin/attendance/capture"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors shadow-xs"
            >
              <Camera size={14} />
              <span>{t.markWithAI}</span>
            </Link>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1">
          <Clock size={13} />
          {language === "hi"
            ? "IndexedDB में स्वतः सुरक्षित"
            : "Auto-saved locally via IndexedDB"}
        </span>
        <Link
          href="/admin/attendance"
          className="text-primary hover:underline font-medium flex items-center gap-1"
        >
          {language === "hi" ? "सम्पूर्ण इतिहास देखें" : "View All History"} <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

