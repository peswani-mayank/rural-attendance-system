"use client";

import { useEffect, useState, useRef } from "react";
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
  Upload,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { offlineDb, OfflineStudent, OfflineClass } from "@/lib/offlineDb";
import { initializeOfflineDatabase } from "@/lib/syncService";
import {
  extractStudentFaceEmbedding,
  loadFaceRecognitionModels,
} from "@/lib/faceRecognition";

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

  // Photo & Biometrics State
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [faceEmbedding, setFaceEmbedding] = useState<number[] | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [biometricSuccess, setBiometricSuccess] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Edit / Re-enroll existing student target
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  async function loadData(applyUrlFilter = false) {
    await initializeOfflineDatabase();
    const loadedStudents = await offlineDb.students.toArray();
    const loadedClasses = await offlineDb.classes.toArray();
    setStudents(loadedStudents);
    setClasses(loadedClasses);

    if (applyUrlFilter && typeof window !== "undefined") {
      const urlClassId = new URLSearchParams(window.location.search).get("classId");
      if (urlClassId && loadedClasses.some((c) => c.id === urlClassId)) {
        setSelectedClass(urlClassId);
        setClassId(urlClassId);
        return;
      }
    }

    if (loadedClasses.length > 0 && !classId) {
      setClassId(loadedClasses[0].id);
    }
  }

  useEffect(() => {
    loadData(true);
    loadFaceRecognitionModels().catch(console.warn);

    return () => {
      stopCamera();
    };
  }, []);

  // Camera Management
  async function startCamera() {
    setBiometricError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setMediaStream(stream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.warn);
      }
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setBiometricError("Camera unavailable. Please check permissions or upload a photo.");
      setIsCameraActive(false);
    }
  }

  function stopCamera() {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setIsCameraActive(false);
  }

  // Snap photo from camera
  async function capturePhotoFromCamera() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPhotoDataUrl(dataUrl);
    stopCamera();

    await processBiometricFace(canvas);
  }

  // Handle uploaded file
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPhotoDataUrl(dataUrl);
      stopCamera();

      const img = new Image();
      img.onload = async () => {
        await processBiometricFace(img);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  // Extract real 128D face embedding
  async function processBiometricFace(source: HTMLCanvasElement | HTMLImageElement) {
    setIsExtracting(true);
    setBiometricError(null);
    setBiometricSuccess(null);
    setFaceEmbedding(null);

    try {
      const result = await extractStudentFaceEmbedding(source);

      if (!result.success || !result.embedding) {
        setBiometricError(result.error || "Could not detect student face.");
        return;
      }

      setFaceEmbedding(result.embedding);
      setBiometricSuccess("Face verified! 128-dimensional biometric embedding generated.");
    } catch (err: any) {
      console.error("Biometric extraction error:", err);
      setBiometricError("Error analyzing face. Please try again with good lighting.");
    } finally {
      setIsExtracting(false);
    }
  }

  function openEnrollModal(studentToEdit?: OfflineStudent) {
    if (studentToEdit) {
      setEditingStudentId(studentToEdit.id);
      setName(studentToEdit.name);
      setRollNumber(studentToEdit.rollNumber);
      setClassId(studentToEdit.classId);
      setGuardianName(studentToEdit.guardianName || "");
      setGuardianPhone(studentToEdit.guardianPhone || "");
      setPhotoDataUrl(studentToEdit.facePhotoUrl || null);
      setFaceEmbedding(studentToEdit.faceEmbedding || null);
      if (studentToEdit.faceEmbedding && studentToEdit.faceEmbedding.length === 128) {
        setBiometricSuccess("Existing face biometric profile loaded.");
      } else {
        setBiometricSuccess(null);
      }
    } else {
      setEditingStudentId(null);
      setName("");
      setRollNumber("");
      if (selectedClass !== "all") {
        setClassId(selectedClass);
      }
      setGuardianName("");
      setGuardianPhone("");
      setPhotoDataUrl(null);
      setFaceEmbedding(null);
      setBiometricSuccess(null);
    }
    setBiometricError(null);
    setIsAddModalOpen(true);
  }

  function closeEnrollModal() {
    stopCamera();
    setIsAddModalOpen(false);
    setEditingStudentId(null);
  }

  async function handleSaveStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !rollNumber || !classId) return;

    if (!faceEmbedding || faceEmbedding.length !== 128) {
      setBiometricError("A valid student photograph with face detection is required for biometric enrollment.");
      return;
    }

    setIsSaving(true);
    const currentClass = classes.find((c) => c.id === classId);

    try {
      // Check for duplicate roll number in same class (excluding current student if editing)
      const existing = await offlineDb.students
        .where("classId")
        .equals(classId)
        .filter((s) => s.rollNumber === rollNumber && s.id !== editingStudentId)
        .first();

      if (existing) {
        setBiometricError(`Roll number ${rollNumber} is already enrolled in this class.`);
        setIsSaving(false);
        return;
      }

      const studentId = editingStudentId || `stu-${Date.now()}`;
      const studentRecord: OfflineStudent = {
        id: studentId,
        name: name.trim(),
        rollNumber: rollNumber.trim(),
        classId,
        section: currentClass?.section || "A",
        facePhotoUrl: photoDataUrl || undefined,
        faceEmbedding: faceEmbedding,
        guardianName: guardianName.trim() || "Parent",
        guardianPhone: guardianPhone.trim() || "+91 90000 00000",
      };

      // 1. Save in local IndexedDB
      await offlineDb.students.put(studentRecord);

      // 2. Sync student counts across classes
      for (const cls of classes) {
        const count = await offlineDb.students.where("classId").equals(cls.id).count();
        if (cls.studentCount !== count) {
          await offlineDb.classes.update(cls.id, { studentCount: count });
        }
      }

      // 3. Sync to MongoDB API if online
      if (navigator.onLine) {
        try {
          await fetch("/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...studentRecord,
              className: currentClass?.name || "Class",
            }),
          });
        } catch {
          // Will sync on next sync pass
        }
      }

      closeEnrollModal();
      await loadData();
    } catch (err: any) {
      console.error("Save error:", err);
      setBiometricError("Error saving student record.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteStudent(id: string) {
    if (!confirm("Are you sure you want to delete this student profile?")) return;

    const student = await offlineDb.students.get(id);
    await offlineDb.students.delete(id);

    if (student) {
      const count = await offlineDb.students.where("classId").equals(student.classId).count();
      await offlineDb.classes.update(student.classId, { studentCount: count });
    }

    if (navigator.onLine) {
      try {
        await fetch(`/api/students?id=${id}`, { method: "DELETE" });
      } catch {
        // Ignored
      }
    }

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
              Student Biometric Directory
            </h1>
            <p className="mt-1 text-sm text-muted">
              Enroll students with real reference photographs and 128-dimensional facial biometric signatures.
            </p>
          </div>

          <button
            onClick={() => openEnrollModal()}
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
            Showing <span className="font-bold text-foreground">{filteredStudents.length}</span> students
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="border-b border-border bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3.5">Student Photo</th>
                  <th className="px-5 py-3.5">Roll No</th>
                  <th className="px-5 py-3.5">Full Name</th>
                  <th className="px-5 py-3.5">Class / Section</th>
                  <th className="px-5 py-3.5">AI Biometrics</th>
                  <th className="px-5 py-3.5">Guardian Contact</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st) => {
                    const studentClass = classes.find((c) => c.id === st.classId);
                    const hasBiometrics = st.faceEmbedding && st.faceEmbedding.length === 128;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3.5">
                          {st.facePhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={st.facePhotoUrl}
                              alt={st.name}
                              className="h-10 w-10 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold text-xs border border-border">
                              {st.name.charAt(0)}
                            </div>
                          )}
                        </td>
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
                        <td className="px-5 py-4">
                          {hasBiometrics ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-light-green px-2.5 py-0.5 text-xs font-semibold text-primary">
                              <CheckCircle size={13} className="text-secondary" />
                              128-D Face Enrolled
                            </span>
                          ) : (
                            <button
                              onClick={() => openEnrollModal(st)}
                              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 hover:bg-amber-200 transition cursor-pointer"
                            >
                              <Camera size={12} />
                              Enroll Face Now
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          <div className="text-foreground font-medium">{st.guardianName || "N/A"}</div>
                          <div className="text-muted flex items-center gap-1 mt-0.5">
                            <Phone size={11} /> {st.guardianPhone || "N/A"}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEnrollModal(st)}
                              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                            >
                              Edit / Re-capture
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(st.id)}
                              className="text-xs text-danger hover:text-red-700 p-1 cursor-pointer"
                              title="Delete Student"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted">
                      <Users size={32} className="mx-auto mb-2 opacity-30 text-primary" />
                      <p className="font-medium text-foreground">No Students Found</p>
                      <p className="text-xs text-muted mt-1">
                        Enroll a student with their reference face photo above.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Enroll Student with Real Face Biometrics */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-xl rounded-2xl bg-surface p-6 shadow-2xl border border-border my-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <UserPlus className="text-primary" size={20} />
                  {editingStudentId ? "Update Student & Face Biometrics" : "Enroll New Student with Face Biometrics"}
                </h3>
                <button
                  onClick={closeEnrollModal}
                  className="rounded-lg p-1 text-muted hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveStudent} className="mt-4 space-y-4">
                {/* Reference Photo Capture / Upload Section */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Student Reference Photograph (Required for Face Recognition) *
                  </label>

                  <div className="rounded-xl border border-border bg-slate-50 p-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Viewport Box */}
                      <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-xl border border-border bg-slate-900 flex items-center justify-center shadow-inner">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className={`h-full w-full object-cover ${isCameraActive ? "block" : "hidden"}`}
                        />

                        {!isCameraActive && photoDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photoDataUrl}
                            alt="Student Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : !isCameraActive && (
                          <div className="text-center p-3 text-slate-400">
                            <Camera size={32} className="mx-auto mb-1 opacity-50" />
                            <span className="text-[11px]">No Face Photo</span>
                          </div>
                        )}

                        {isExtracting && (
                          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white p-2 text-center">
                            <Sparkles className="animate-spin text-emerald-400 mb-1" size={24} />
                            <span className="text-[11px] font-semibold">Extracting 128-D Face Vector...</span>
                          </div>
                        )}
                      </div>

                      {/* Photo Controls */}
                      <div className="flex-1 space-y-2 w-full">
                        {isCameraActive ? (
                          <button
                            type="button"
                            onClick={capturePhotoFromCamera}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
                          >
                            <Camera size={14} /> Capture Face
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startCamera}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition cursor-pointer"
                          >
                            <Camera size={14} /> Open Webcam
                          </button>
                        )}

                        <label className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:bg-light-green transition cursor-pointer">
                          <Upload size={14} /> Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>

                        {photoDataUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoDataUrl(null);
                              setFaceEmbedding(null);
                              setBiometricSuccess(null);
                              setBiometricError(null);
                              stopCamera();
                            }}
                            className="w-full text-center text-xs text-danger hover:underline cursor-pointer"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Biometric Status Feedback */}
                    {biometricSuccess && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-100 p-2 text-xs font-semibold text-emerald-800">
                        <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                        <span>{biometricSuccess}</span>
                      </div>
                    )}

                    {biometricError && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700 border border-red-200">
                        <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />
                        <span>{biometricError}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name & Roll Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                      Student Full Name *
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

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                      Roll Number / Student ID *
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
                </div>

                {/* Class Assignment */}
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

                {/* Guardian Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      Guardian Contact Phone
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

                {/* Hidden canvas for bitmap processing */}
                <canvas ref={canvasRef} className="hidden" />

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={closeEnrollModal}
                    className="rounded-lg px-4 py-2 text-xs font-medium text-muted hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !faceEmbedding}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Saving Biometrics...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        <span>Save & Enroll Student</span>
                      </>
                    )}
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
