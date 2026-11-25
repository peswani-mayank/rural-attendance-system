"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import {
  BarChart3,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Filter,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { offlineDb, OfflineClass, OfflineStudent, OfflineAttendanceRecord } from "@/lib/offlineDb";

interface ClassStat {
  class: string;
  attendance: number;
  totalPresent: number;
  totalAbsent: number;
}

interface MonthlyStat {
  month: string;
  presentRate: number;
  absentRate: number;
}

interface AtRiskStudent {
  name: string;
  roll: string;
  class: string;
  rate: string;
  absentDays: number;
  totalDays: number;
}

export default function ReportsPage() {
  const [classComparisonData, setClassComparisonData] = useState<ClassStat[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyStat[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [totalSessions, setTotalSessions] = useState<number>(0);

  useEffect(() => {
    async function calculateRealReports() {
      try {
        const classes = await offlineDb.classes.toArray();
        const students = await offlineDb.students.toArray();
        const sessions = await offlineDb.attendanceQueue.toArray();

        setTotalSessions(sessions.length);

        // 1. Calculate Real Class-Wise Comparison
        const classStats: ClassStat[] = classes.map((cls) => {
          const classSessions = sessions.filter((s) => s.classId === cls.id);
          const present = classSessions.reduce((acc, s) => acc + s.totalPresent, 0);
          const absent = classSessions.reduce((acc, s) => acc + s.totalAbsent, 0);
          const total = present + absent;
          const rate = total > 0 ? Math.round((present / total) * 100) : 0;

          return {
            class: cls.name,
            attendance: rate,
            totalPresent: present,
            totalAbsent: absent,
          };
        });
        setClassComparisonData(classStats);

        // 2. Calculate Monthly Trends from real recorded session dates
        const monthMap = new Map<string, { present: number; absent: number }>();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        sessions.forEach((s) => {
          if (s.date) {
            const m = monthNames[new Date(s.date).getMonth()] || "Nov";
            const cur = monthMap.get(m) || { present: 0, absent: 0 };
            cur.present += s.totalPresent;
            cur.absent += s.totalAbsent;
            monthMap.set(m, cur);
          }
        });

        if (monthMap.size > 0) {
          const mData: MonthlyStat[] = Array.from(monthMap.entries()).map(([month, counts]) => {
            const total = counts.present + counts.absent;
            const pRate = total > 0 ? Math.round((counts.present / total) * 100) : 0;
            return {
              month,
              presentRate: pRate,
              absentRate: 100 - pRate,
            };
          });
          setMonthlyData(mData);
        } else {
          // Default baseline if no sessions yet
          setMonthlyData([{ month: "Nov", presentRate: 0, absentRate: 0 }]);
        }

        // 3. Real Chronic Absentee / At-Risk Student Analysis
        // Track per-student presence across all recorded sessions
        const studentStats = new Map<string, { presentCount: number; totalSessions: number }>();

        sessions.forEach((s) => {
          s.records.forEach((r) => {
            const cur = studentStats.get(r.studentId) || { presentCount: 0, totalSessions: 0 };
            cur.totalSessions++;
            if (r.status === "present") {
              cur.presentCount++;
            }
            studentStats.set(r.studentId, cur);
          });
        });

        const atRisk: AtRiskStudent[] = [];
        students.forEach((st) => {
          const stat = studentStats.get(st.id);
          if (stat && stat.totalSessions > 0) {
            const rate = Math.round((stat.presentCount / stat.totalSessions) * 100);
            const absentDays = stat.totalSessions - stat.presentCount;

            // Flag students with < 75% attendance or >= 1 absent day
            if (rate < 75 || absentDays > 0) {
              const cls = classes.find((c) => c.id === st.classId);
              atRisk.push({
                name: st.name,
                roll: st.rollNumber,
                class: cls?.name || "Class",
                rate: `${rate}%`,
                absentDays,
                totalDays: stat.totalSessions,
              });
            }
          }
        });

        setAtRiskStudents(atRisk);
      } catch (err) {
        console.error("Error computing reports:", err);
      }
    }

    calculateRealReports();
  }, []);

  function handleExportCSV() {
    let csv = "Class,Average Attendance %,Total Present Count,Total Absent Count\n";
    classComparisonData.forEach((row) => {
      csv += `"${row.class}",${row.attendance}%,${row.totalPresent},${row.totalAbsent}\n`;
    });

    if (atRiskStudents.length > 0) {
      csv += "\nAt-Risk Students (Below 75% or Chronic Absence)\n";
      csv += "Roll Number,Student Name,Class,Attendance Rate,Days Absent,Total Sessions\n";
      atRiskStudents.forEach((st) => {
        csv += `"#${st.roll}","${st.name}","${st.class}","${st.rate}",${st.absentDays},${st.totalDays}\n`;
      });
    }

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rural_real_attendance_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="min-w-0 flex-1 p-6 md:p-8">
        <DashboardHeader />

        {/* Title & Export */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="text-primary" size={26} />
              Attendance Analytics & Reports
            </h1>
            <p className="mt-1 text-sm text-muted">
              Real-time analytics computed directly from {totalSessions} recorded classroom attendance session(s).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition shadow-xs cursor-pointer"
            >
              <Download size={16} />
              <span>Export Real Data (CSV)</span>
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
          {/* Monthly Trend Chart */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
            <h3 className="text-base font-bold text-foreground">
              Monthly Attendance Trend
            </h3>
            <p className="text-xs text-muted mt-1 mb-6">
              Real monthly attendance computed from recorded sessions
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(value) => [`${value}%`]} />
                  <Legend />
                  <Bar dataKey="presentRate" name="Present %" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absentRate" name="Absent %" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Class-wise Comparison */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
            <h3 className="text-base font-bold text-foreground">
              Class-wise Attendance Comparison
            </h3>
            <p className="text-xs text-muted mt-1 mb-6">
              Actual attendance percentage per registered class
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classComparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="class" width={90} />
                  <Tooltip formatter={(value, name, item: any) => {
                    const row = item?.payload as ClassStat;
                    return [`${value}% (${row?.totalPresent || 0} Present, ${row?.totalAbsent || 0} Absent)`, "Attendance Rate"];
                  }} />
                  <Bar dataKey="attendance" fill="#166534" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Low Attendance Alert Table */}
        <div className="rounded-xl border border-border bg-surface shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle size={20} />
              <h3 className="text-base font-bold text-foreground">
                Attendance Alerts: Students with Absences in Recorded Sessions
              </h3>
            </div>
            <span className="text-xs text-muted">
              Auto-computed from actual student attendance records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Attendance Rate</th>
                  <th className="px-4 py-3">Sessions Missed</th>
                  <th className="px-4 py-3 text-right">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {atRiskStudents.length > 0 ? (
                  atRiskStudents.map((st, i) => (
                    <tr key={i} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono text-xs">#{st.roll}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{st.name}</td>
                      <td className="px-4 py-3 text-xs text-muted">{st.class}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs font-bold">
                          {st.rate}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground font-medium">
                        {st.absentDays} of {st.totalDays} sessions
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-xs font-semibold text-primary hover:underline cursor-pointer">
                          Contact Guardian
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted text-xs">
                      {totalSessions > 0
                        ? "Great news! All enrolled students have 100% attendance across recorded sessions."
                        : "No attendance sessions recorded yet. Record classroom sessions to populate real student risk analysis."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
