"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { offlineDb, OfflineAttendanceRecord } from "@/lib/offlineDb";
import { useLanguage } from "@/lib/languageContext";

interface ChartDayData {
  day: string;
  date: string;
  attendance: number;
  totalPresent: number;
  totalAbsent: number;
  hasData: boolean;
}

export default function AttendanceChart() {
  const { language, t } = useLanguage();
  const [chartData, setChartData] = useState<ChartDayData[]>([]);
  const [overallAverage, setOverallAverage] = useState<number>(0);

  useEffect(() => {
    async function calculateRealWeeklyAttendance() {
      try {
        const allSessions = await offlineDb.attendanceQueue.toArray();

        // Map of date string YYYY-MM-DD -> { present, absent }
        const dateMap = new Map<string, { present: number; absent: number }>();
        allSessions.forEach((session) => {
          const current = dateMap.get(session.date) || { present: 0, absent: 0 };
          current.present += session.totalPresent;
          current.absent += session.totalAbsent;
          dateMap.set(session.date, current);
        });

        // Generate past 6 calendar days up to today
        const days: ChartDayData[] = [];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          const dayName = dayNames[d.getDay()];

          const record = dateMap.get(dateStr);
          if (record && record.present + record.absent > 0) {
            const total = record.present + record.absent;
            const pct = Math.round((record.present / total) * 100);
            days.push({
              day: dayName,
              date: dateStr,
              attendance: pct,
              totalPresent: record.present,
              totalAbsent: record.absent,
              hasData: true,
            });
          } else {
            days.push({
              day: dayName,
              date: dateStr,
              attendance: 0,
              totalPresent: 0,
              totalAbsent: 0,
              hasData: false,
            });
          }
        }

        // If today or past days have records, compute overall average
        const activeDays = days.filter((d) => d.hasData);
        if (activeDays.length > 0) {
          const avg = Math.round(
            activeDays.reduce((acc, d) => acc + d.attendance, 0) / activeDays.length
          );
          setOverallAverage(avg);
        } else if (allSessions.length > 0) {
          // If past sessions have different dates, populate directly from recorded sessions
          const recordedDays: ChartDayData[] = allSessions.slice(-6).map((s) => {
            const total = s.totalPresent + s.totalAbsent;
            const pct = total > 0 ? Math.round((s.totalPresent / total) * 100) : 0;
            return {
              day: s.date.slice(5),
              date: s.date,
              attendance: pct,
              totalPresent: s.totalPresent,
              totalAbsent: s.totalAbsent,
              hasData: true,
            };
          });
          days.splice(0, days.length, ...recordedDays);
          const avg = Math.round(
            recordedDays.reduce((acc, d) => acc + d.attendance, 0) / recordedDays.length
          );
          setOverallAverage(avg);
        }

        setChartData(days);
      } catch (err) {
        console.error("Error computing weekly attendance:", err);
      }
    }

    calculateRealWeeklyAttendance();
  }, []);

  return (
    <div className="w-full min-w-0 rounded-xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {t.weeklyAttendance}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {language === "hi"
              ? "दैनिक कक्षा सत्रों के आधार पर वास्तविक उपस्थिति प्रतिशत"
              : "Real attendance percentage computed from daily classroom sessions"}
          </p>
        </div>

        {overallAverage > 0 && (
          <div className="text-right">
            <span className="text-xs font-semibold text-muted block">
              {language === "hi" ? "औसत दर" : "Avg Rate"}
            </span>
            <span className="text-lg font-bold text-primary">{overallAverage}%</span>
          </div>
        )}
      </div>

      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip
              formatter={(value, name, item: any) => {
                const payload = item?.payload as ChartDayData;
                if (!payload || !payload.hasData) {
                  return ["0% (No sessions)", "Attendance"];
                }
                return [
                  `${value}% (${payload.totalPresent} Present, ${payload.totalAbsent} Absent)`,
                  "Attendance",
                ];
              }}
            />
            <Bar
              dataKey="attendance"
              fill="#166534"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
        <span>Updates automatically as classroom photos are recorded</span>
        <span className="font-medium text-emerald-700">Live Data</span>
      </div>
    </div>
  );
}
