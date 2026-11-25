"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import {
  GraduationCap,
  UserPlus,
  Mail,
  Phone,
  BookOpen,
  X,
  CheckCircle,
} from "lucide-react";
import { offlineDb, OfflineTeacher } from "@/lib/offlineDb";
import { initializeOfflineDatabase } from "@/lib/syncService";

export default function TeachersManagementPage() {
  const [teachers, setTeachers] = useState<OfflineTeacher[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [assignedClass, setAssignedClass] = useState<string>("Grade 5-A");

  async function loadTeachers() {
    await initializeOfflineDatabase();
    const data = await offlineDb.teachers.toArray();
    setTeachers(data);
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  async function handleAddTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return;

    const newTeacher: OfflineTeacher = {
      id: `tch-${Date.now()}`,
      name,
      email,
      phone: phone || "+91 94140 00000",
      subject: subject || "General Subjects",
      assignedClass,
      status: "active",
    };

    await offlineDb.teachers.add(newTeacher);
    setName("");
    setEmail("");
    setPhone("");
    setSubject("");
    setIsAddModalOpen(false);
    await loadTeachers();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="min-w-0 flex-1 p-6 md:p-8">
        <DashboardHeader />

        {/* Title & Add Button */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="text-primary" size={26} />
              Faculty & Class Teachers
            </h1>
            <p className="mt-1 text-sm text-muted">
              Manage school teachers, class assignments, and attendance authorization credentials.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition shadow-xs cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Add New Teacher</span>
          </button>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((tch) => (
            <div
              key={tch.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between hover:border-primary/50 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-light-green text-primary font-bold">
                    {tch.name.charAt(0)}
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-semibold">
                    {tch.status === "active" ? "Active" : "On Leave"}
                  </span>
                </div>

                <h3 className="text-base font-bold text-foreground">{tch.name}</h3>
                <p className="text-xs text-muted flex items-center gap-1 mt-1">
                  <BookOpen size={12} className="text-primary" />
                  <span>{tch.subject}</span>
                </p>

                <div className="mt-4 space-y-1.5 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-400" />
                    <span>{tch.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400" />
                    <span>{tch.phone}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  In-charge: {tch.assignedClass}
                </span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle size={12} /> Authorized
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Add Teacher */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="text-primary" size={20} />
                  Add New Teacher
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg p-1 text-muted hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTeacher} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Teacher Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rameshwar Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="teacher@school.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 94140 00000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                      Assigned Class
                    </label>
                    <select
                      value={assignedClass}
                      onChange={(e) => setAssignedClass(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                    >
                      <option value="Grade 5-A">Grade 5-A</option>
                      <option value="Grade 6-A">Grade 6-A</option>
                      <option value="Grade 7-B">Grade 7-B</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Subjects Taught
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Science & Mathematics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
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
                    Save Teacher
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

