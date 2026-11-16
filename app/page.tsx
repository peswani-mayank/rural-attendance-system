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

export default function Home() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="min-w-0 flex-1 p-6 md:p-8">
        <DashboardHeader />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted">
            Monitor rural school attendance, offline sync status, and classroom activity.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Students"
            value="450"
            description="Enrolled in school"
            icon={Users}
            color="text-primary"
            bgColor="bg-light-green"
          />

          <StatCard
            title="Present Today"
            value="420"
            description="Students marked present"
            icon={UserCheck}
            color="text-success"
            bgColor="bg-green-50"
          />

          <StatCard
            title="Absent Today"
            value="30"
            description="Students marked absent"
            icon={UserX}
            color="text-danger"
            bgColor="bg-red-50"
          />

          <StatCard
            title="Total Teachers"
            value="25"
            description="Registered faculty"
            icon={GraduationCap}
            color="text-primary"
            bgColor="bg-light-green"
          />
        </div>

        {/* Charts & Recent Attendance Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <AttendanceChart />
          <RecentAttendance />
        </div>
      </main>
    </div>
  );
}


y h be mera isme page.tsx m project wala y q n run ho rha
