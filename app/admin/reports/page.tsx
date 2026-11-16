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

const monthlyData = [
  { month: "Jul", presentRate: 88, absentRate: 12 },
  { month: "Aug", presentRate: 91, absentRate: 9 },
  { month: "Sep", presentRate: 86, absentRate: 14 },
  { month: "Oct", presentRate: 94, absentRate: 6 },
  { month: "Nov", presentRate: 92, absentRate: 8 },
];

const classComparisonData = [
  { class: "Grade 5-A", attendance: 93 },
  { class: "Grade 6-A", attendance: 89 },
  { class: "Grade 7-B", attendance: 84 },
  { class: "Grade 8-A", attendance: 91 },
  { class: "Grade 9-A", attendance: 78 },
];

const atRiskStudents = [
  { name: "Devendra Kumar", roll: "505", class: "Grade 5-A", rate: "68%", absentDays: 7 },
  { name: "Kavita Devi", roll: "508", class: "Grade 5-A", rate: "71%", absentDays: 6 },
  { name: "Sunil Verma", roll: "604", class: "Grade 6-A", rate: "64%", absentDays: 9 },
];

export default function ReportsPage() {
  const [selectedRange, setSelectedRange] = useState("This Month");

  function handleExportCSV() {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Class,Average Attendance %\n" +
      classComparisonData.map((e) => `${e.class},${e.attendance}%`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rural_attendance_report_${Date.now()}.csv`);
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
              Analyze monthly trends, class comparisons, and detect chronic student absenteeism early.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition shadow-xs cursor-pointer"
            >
              <Download size={16} />
              <span>Export CSV Report</span>
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
              Percentage of enrolled students attending classes
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
              Comparing average attendance rates across standards
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classComparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="class" width={80} />
                  <Tooltip formatter={(value) => [`${value}%`, "Attendance Rate"]} />
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
                Attendance Alert: Students Below 75% Threshold
              </h3>
            </div>
            <span className="text-xs text-muted">
              Auto-generated for rural education retention intervention
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
                  <th className="px-4 py-3">Consecutive Days Missed</th>
                  <th className="px-4 py-3 text-right">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {atRiskStudents.map((st, i) => (
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
                      {st.absentDays} days
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs font-semibold text-primary hover:underline cursor-pointer">
                        Notify Parent
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

