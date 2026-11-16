
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const attendanceData = [
  { day: "Mon", attendance: 85 },
  { day: "Tue", attendance: 92 },
  { day: "Wed", attendance: 78 },
  { day: "Thu", attendance: 95 },
  { day: "Fri", attendance: 88 },
  { day: "Sat", attendance: 75 },
];

export default function AttendanceChart() {
  return (
    <div className="w-full min-w-0 rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground">
          Weekly Attendance
        </h2>
        <p className="mt-1 text-sm text-muted">
          Attendance percentage over the last 6 days
        </p>
      </div>

      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} unit="%" />

            <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} />

            <Bar
              dataKey="attendance"
              fill="#16a34a"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
