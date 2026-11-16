"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  Phone,
  UserCheck,
  X,
  Camera,
} from "lucide-react";
import { offlineDb, OfflineStudent, OfflineClass } from "@/lib/offlineDb";
import { initializeOfflineDatabase } from "@/lib/syncService";

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<OfflineStudent[]>([]);
  const [classes, setClasses] = useState<OfflineClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>("");
  const [rollNumber, setRollNumber] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
  const [guardianName, setGuardianName] = useState<string>("");
  const [guardianPhone, setGuardianPhone] = useState<string>("");

  async function loadData() {
    await initializeOfflineDatabase();
    const loadedStudents = await offlineDb.students.toArray();
    const loadedClasses = await offlineDb.classes.toArray();
    setStudents(loadedStudents);
    setClasses(loadedClasses);
    if (loadedClasses.length > 0 && !classId) {
      setClassId(loadedClasses[0].id);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !rollNumber || !classId) return;

    const currentClass = classes.find((c) => c.id === classId);
    const newStudent: OfflineStudent = {
      id: `stu-${Date.now()}`,
      name,
      rollNumber,
      classId,
      section: currentClass?.section || "A",
      guardianName: guardianName || "Parent",
      guardianPhone: guardianPhone || "+91 90000 00000",
    };

    await offlineDb.students.add(newStudent);

    // Update class student count
    if (currentClass) {
      await offlineDb.classes.update(currentClass.id, {
        studentCount: (currentClass.studentCount || 0) + 1,
      });
    }

    // Reset Form
    setName("");
    setRollNumber("");
    setGuardianName("");
    setGuardianPhone("");
    setIsAddModalOpen(false);
    await loadData();
  }

  const filteredStudents = students.filter((s) => {
    const matchesClass = selectedClass === "all" || s.classId === selectedClass;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.includes(searchQuery);
    return matchesClass && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="min-w-0 flex-1 p-6 md:p-8">
        <DashboardHeader />

        {/* Title & Add Student Button */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="text-primary" size={26} />
              Enrolled Students
            </h1>
            <p className="mt-1 text-sm text-muted">
              Manage student enrollment profiles and biometric records for AI classroom identification.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition shadow-xs cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Enroll New Student</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
              <Search size={15} className="text-muted" />
              <input
                type="text"
                placeholder="Search by name or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-foreground placeholder:text-muted focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={15} className="text-muted" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
              >
                <option value="all">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.section})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-muted">
            Total Enrolled: <span className="font-bold text-foreground">{filteredStudents.length}</span> students
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="border-b border-border bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3.5">Roll No</th>
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-5 py-3.5">Class / Section</th>
                  <th className="px-5 py-3.5">Guardian Details</th>
                  <th className="px-5 py-3.5">AI Biometrics</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st) => {
                    const studentClass = classes.find((c) => c.id === st.classId);

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-4 font-mono font-bold text-xs text-primary">
                          #{st.rollNumber}
                        </td>
                        <td className="px-5 py-4 font-semibold text-foreground">
                          {st.name}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          <span className="font-medium text-foreground">
                            {studentClass?.name || "Class"}
                          </span>
                          <span className="text-muted ml-1">
                            (Sec {st.section})
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs">
                          <div className="text-foreground font-medium">{st.guardianName || "N/A"}</div>
                          <div className="text-muted flex items-center gap-1 mt-0.5">
                            <Phone size={11} /> {st.guardianPhone || "N/A"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-light-green px-2 py-0.5 text-[11px] font-semibold text-primary">
                            <UserCheck size={12} /> Face Profile Active
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted">
                      <Users size={32} className="mx-auto mb-2 opacity-30 text-primary" />
                      <p className="font-medium text-foreground">No Students Found</p>
                      <p className="text-xs text-muted mt-1">
                        Try clearing your search filters or enroll a new student.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Enroll Student */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl border border-border">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <UserPlus className="text-primary" size={20} />
                  Enroll New Student
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg p-1 text-muted hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                      Roll Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 515"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                      Class & Section *
                    </label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.section})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                      Guardian Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mukesh Chandra"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 00000"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-light-green/60 p-3 text-xs text-primary flex items-center gap-2">
                  <Camera size={16} />
                  <span>Student profile will be enrolled for AI facial recognition immediately.</span>
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
                    Save & Enroll
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

