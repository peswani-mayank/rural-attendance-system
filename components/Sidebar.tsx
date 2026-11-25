"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  BarChart3,
  Settings,
  School,
  LogOut,
} from "lucide-react";
import { useLanguage } from "@/lib/languageContext";
import { useAuth } from "@/lib/authContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const { user, role, logout } = useAuth();

  const allNavigation = [
    {
      name: t.dashboard,
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      name: language === "hi" ? "कैमरा से उपस्थिति लें" : "Take Attendance (AI)",
      href: "/admin/attendance/capture",
      icon: ClipboardCheck,
      adminOnly: false,
    },
    {
      name: t.attendance,
      href: "/admin/attendance",
      icon: ClipboardCheck,
      adminOnly: false,
    },
    {
      name: t.students,
      href: "/admin/students",
      icon: Users,
      adminOnly: false,
    },
    {
      name: t.teachers,
      href: "/admin/teachers",
      icon: GraduationCap,
      adminOnly: true,
    },
    {
      name: t.classes,
      href: "/admin/classes",
      icon: School,
      adminOnly: true,
    },
    {
      name: t.reports,
      href: "/admin/reports",
      icon: BarChart3,
      adminOnly: true,
    },
  ];

  const navigation = allNavigation.filter((item) =>
    role === "teacher" ? !item.adminOnly : true
  );

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-border bg-surface p-5">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
          <School size={24} />
        </div>

        <div>
          <h1 className="text-lg font-bold text-primary">
            RuralAttend
          </h1>
          <p className="text-xs text-muted">
            Attendance System
          </p>
        </div>
      </div>

      {/* Navigation */}
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
        {t.mainMenu}
      </p>

      <nav className="flex-1 space-y-1.5">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === "/admin/dashboard" && pathname === "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-white font-semibold shadow-xs"
                  : "text-muted hover:bg-light-green hover:text-primary"
              }`}
            >
              <Icon size={19} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="space-y-1.5 border-t border-border pt-4">
        {user && (
          <div className="mb-2 rounded-lg bg-light-green/60 p-2.5 text-xs">
            <p className="font-bold text-primary truncate">{user.name}</p>
            <p className="text-[11px] text-muted flex items-center justify-between">
              <span>{user.role === "admin" ? (language === "hi" ? "प्रशासक" : "Administrator") : (language === "hi" ? "शिक्षक" : "Teacher")}</span>
              {user.assignedClass && <span className="font-semibold text-emerald-800">{user.assignedClass}</span>}
            </p>
          </div>
        )}

        <Link
          href="/admin/settings"
          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-muted hover:bg-light-green hover:text-primary transition-colors"
        >
          <Settings size={19} />
          {t.settings}
        </Link>

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-danger hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut size={19} />
          {t.logout}
        </button>
      </div>
    </aside>
  );
}
