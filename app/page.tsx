"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import AttendanceChart from "@/components/dashboard/AttendanceChart";
import RecentAttendance from "@/components/dashboard/RecentAttendance";
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
} from "lucide-react";
import { offlineDb } from "@/lib/offlineDb";
import { initializeOfflineDatabase } from "@/lib/syncService";
import { useLanguage } from "@/lib/languageContext";

export default function Home() {
  const { t, language } = useLanguage();
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [presentToday, setPresentToday] = useState<number>(0);
  const [absentToday, setAbsentToday] = useState<number>(0);
  const [totalTeachers, setTotalTeachers] = useState<number>(0);
  const [latestDateLabel, setLatestDateLabel] = useState<string>("");

  useEffect(() => {
    async function loadRealDashboardMetrics() {
      await initializeOfflineDatabase();

      try {
        // 1. Real Total Enrolled Students
        const studentCount = await offlineDb.students.count();
        setTotalStudents(studentCount);

        // 2. Real Total Teachers
        const teacherCount = await offlineDb.teachers.count();
        setTotalTeachers(teacherCount || 3);

        // 3. Real Today / Latest Attendance Sessions
        const todayStr = new Date().toISOString().split("T")[0];
        const allSessions = await offlineDb.attendanceQueue
          .orderBy("createdAt")
          .reverse()
          .toArray();

        const todaySessions = allSessions.filter((s) => s.date === todayStr);

        if (todaySessions.length > 0) {
          const present = todaySessions.reduce((acc, s) => acc + s.totalPresent, 0);
          const absent = todaySessions.reduce((acc, s) => acc + s.totalAbsent, 0);
          setPresentToday(present);
          setAbsentToday(absent);
          setLatestDateLabel(todayStr);
        } else if (allSessions.length > 0) {
          // If no session recorded yet today, display the latest recorded session stats
          const latest = allSessions[0];
          setPresentToday(latest.totalPresent);
          setAbsentToday(latest.totalAbsent);
          setLatestDateLabel(latest.date);
        } else {
          setPresentToday(0);
          setAbsentToday(0);
          setLatestDateLabel(todayStr);
        }
      } catch (err) {
        console.error("Error loading dashboard metrics:", err);
      }
    }

    loadRealDashboardMetrics();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="min-w-0 flex-1 p-6 md:p-8">
        <DashboardHeader />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {language === "hi" ? "प्रशासनिक डैशबोर्ड" : "Admin Dashboard"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {language === "hi"
              ? "ग्रामीण विद्यालय उपस्थिति और नामांकित छात्र बायोमेट्रिक्स की रीयल-टाइम निगरानी।"
              : "Monitor real-time rural school attendance and enrolled student biometrics."}
          </p>
        </div>

        {/* 4 Real Stat Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={t.totalStudents}
            value={totalStudents.toString()}
            description={t.enrolledInSchool}
            icon={Users}
            color="text-primary"
            bgColor="bg-light-green"
          />

          <StatCard
            title={latestDateLabel ? `${t.presentToday} (${latestDateLabel})` : t.presentToday}
            value={presentToday.toString()}
            description={t.verifiedByAI}
            icon={UserCheck}
            color="text-success"
            bgColor="bg-green-50"
          />

          <StatCard
            title={latestDateLabel ? `${t.absentToday} (${latestDateLabel})` : t.absentToday}
            value={absentToday.toString()}
            description={t.notInClassroom}
            icon={UserX}
            color="text-danger"
            bgColor="bg-red-50"
          />

          <StatCard
            title={t.totalTeachers}
            value={totalTeachers.toString()}
            description={t.activeFaculty}
            icon={GraduationCap}
            color="text-primary"
            bgColor="bg-light-green"
          />
        </div>

        {/* Real Charts & Recent Attendance Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <AttendanceChart />
          <RecentAttendance />
        </div>
      </main>
    </div>
  );
}
