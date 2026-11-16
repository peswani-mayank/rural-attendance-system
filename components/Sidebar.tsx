
import Link from "next/link";
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

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Students",
    href: "/admin/students",
    icon: Users,
  },
  {
    name: "Teachers",
    href: "/admin/teachers",
    icon: GraduationCap,
  },
  {
    name: "Classes",
    href: "/admin/classes",
    icon: School,
  },
  {
    name: "Attendance",
    href: "/admin/attendance",
    icon: ClipboardCheck,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
];

export default function Sidebar() {
  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-border bg-surface p-5">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
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
        Main Menu
      </p>

      <nav className="flex-1 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-light-green hover:text-primary"
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="space-y-2 border-t border-border pt-4">
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-muted hover:bg-light-green hover:text-primary"
        >
          <Settings size={20} />
          Settings
        </Link>

        <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-danger hover:bg-red-50">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
