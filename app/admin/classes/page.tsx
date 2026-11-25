"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import {
  School,
  Plus,
  Users,
  GraduationCap,
  X,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { offlineDb, OfflineClass } from "@/lib/offlineDb";
import { initializeOfflineDatabase } from "@/lib/syncService";

interface ClassWithStats extends OfflineClass {
  realStudentCount: number;
  teacherName?: string;
}

export default function ClassesManagementPage() {
  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>("");
  const [grade, setGrade] = useState<string>("5");
  const [section, setSection] = useState<string>("A");

  async function loadClasses() {
    await initializeOfflineDatabase();
    const [loadedClasses, loadedStudents, loadedTeachers] = await Promise.all([
      offlineDb.classes.toArray(),
      offlineDb.students.toArray(),
      offlineDb.teachers.toArray(),
    ]);

    const classesWithStats: ClassWithStats[] = await Promise.all(
      loadedClasses.map(async (cls) => {
        const realStudentCount = loadedStudents.filter((s) => s.classId === cls.id).length;
        if (cls.studentCount !== realStudentCount) {
          await offlineDb.classes.update(cls.id, { studentCount: realStudentCount });
        }
        const assignedTeacher = loadedTeachers.find((t) => t.assignedClass === cls.name);
        return {
          ...cls,
          studentCount: realStudentCount,
          realStudentCount,
          teacherName: assignedTeacher?.name,
        };
      })
    );

    setClasses(classesWithStats);
  }

  useEffect(() => {
    loadClasses();
  }, []);

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault();
    if (!grade || !section) return;

    const className = name.trim() || `Grade ${grade}-${section}`;
    const newClass: OfflineClass = {
      id: `cls-${Date.now()}`,
      name: className,
      grade,
      section,
      studentCount: 0,
    };

    await offlineDb.classes.add(newClass);
    setName("");
    setGrade("5");
    setSection("A");
    setIsAddModalOpen(false);
    await loadClasses();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="min-w-0 flex-1 p-6 md:p-8">
        <DashboardHeader />

        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <School className="text-primary" size={26} />
              School Classes & Sections
            </h1>
            <p className="mt-1 text-sm text-muted">
              Configure class divisions, sections, and student allocations.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition shadow-xs cursor-pointer"
          >
            <Plus size={16} />
            <span>Create New Class</span>
          </button>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between hover:border-primary/50 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-light-green text-primary font-bold">
                    {cls.grade}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-muted">
                    Sec {cls.section}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground">{cls.name}</h3>
                <p className="text-xs text-muted mt-1">
                  Academic Year 2026-2027
                </p>

                <div className="mt-4 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-muted">
                    <Users size={14} className="text-primary" />
                    <span>{cls.realStudentCount} Students</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted">
                    <GraduationCap size={14} className="text-emerald-600" />
                    <span>{cls.teacherName || "No Teacher Assigned"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs">
                <Link
                  href={`/admin/attendance/capture?classId=${encodeURIComponent(cls.id)}`}
                  className="font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Take Attendance <ChevronRight size={13} />
                </Link>
                <Link
                  href={`/admin/students?classId=${encodeURIComponent(cls.id)}`}
                  className="text-muted hover:text-foreground"
                >
                  View Students
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Create Class */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="text-primary" size={20} />
                  Add Class & Section
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg p-1 text-muted hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddClass} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Grade / Standard *
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                      <option key={g} value={g.toString()}>
                        Standard {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Section *
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                  >
                    {["A", "B", "C", "D"].map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Display Label (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. Grade ${grade}-${section}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-lg px-4 py-2 text-xs font-medium text-muted hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs cursor-pointer"
                  >
                    Create Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

