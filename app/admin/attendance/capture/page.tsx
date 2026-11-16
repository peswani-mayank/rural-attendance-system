"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Users,
  ShieldCheck,
  Check,
  X,
  Clock,
  SwitchCamera,
  VideoOff,
} from "lucide-react";
import {
  offlineDb,
  OfflineClass,
  OfflineStudent,
  AttendanceStudentItem,
  OfflineAttendanceRecord,
} from "@/lib/offlineDb";
import { initializeOfflineDatabase, syncPendingAttendance } from "@/lib/syncService";

export default function AttendanceCapturePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Form State
  const [classes, setClasses] = useState<OfflineClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Camera / Media State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // AI & Verification State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false);
  const [studentsList, setStudentsList] = useState<AttendanceStudentItem[]>([]);
  const [unknownFacesCount, setUnknownFacesCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Automatically attach mediaStream to video whenever stream updates
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch((err) => {
          console.warn("Video play error:", err);
        });
      };
    }
  }, [mediaStream, isCameraActive]);

  // Load classes from offline db on mount
  useEffect(() => {
    setSelectedDate(new Date().toISOString().split("T")[0]);

    async function loadInitialData() {
      await initializeOfflineDatabase();
      const loadedClasses = await offlineDb.classes.toArray();
      setClasses(loadedClasses);
      if (loadedClasses.length > 0) {
        setSelectedClassId(loadedClasses[0].id);
      }
    }
    loadInitialData();

    return () => {
      stopCamera();
    };
  }, []);

  // Start live device camera with fallback
  async function startCamera(overrideMode?: "user" | "environment") {
    setCameraError(null);
    const targetMode = overrideMode || facingMode;

    try {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: targetMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (modeErr) {
        console.warn("Explicit facingMode camera not available, falling back to default camera:", modeErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setMediaStream(stream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
    } catch (err: any) {
      console.warn("Could not access camera:", err);
      setCameraError(
        "Camera access denied or unavailable. Please check that camera permissions are enabled in your browser, or upload a photo."
      );
      setIsCameraActive(false);
    }
  }

  function flipCamera() {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode);
  }

  function stopCamera() {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setIsCameraActive(false);
  }

  // Capture snapshot from video
  function captureSnapshot() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setCapturedPhoto(dataUrl);
      stopCamera();
      runAIIdentification(dataUrl);
    }
  }

  // Handle manual photo upload
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCapturedPhoto(result);
      stopCamera();
      runAIIdentification(result);
    };
    reader.readAsDataURL(file);
  }

  // Simulate AI face detection & student identification
  async function runAIIdentification(photoData: string) {
    setIsAnalyzing(true);
    setAnalysisComplete(false);

    try {
      // Load enrolled students for this class from IndexedDB
      const enrolledStudents = await offlineDb.students
        .where("classId")
        .equals(selectedClassId)
        .toArray();

      // Simulate AI inference delay (multi-face feature extraction and matching)
      await new Promise((r) => setTimeout(r, 1400));

      // Generate realistic AI detection suggestions:
      // Most students detected present with high confidence, 1-2 absent, and chance of unknown face
      const verifiedList: AttendanceStudentItem[] = enrolledStudents.map((st, idx) => {
        // Deterministic simulation based on index:
        const isAbsent = idx === 2 || idx === 7;
        const confidence = isAbsent
          ? 0.12
          : parseFloat((0.85 + (idx % 12) * 0.012).toFixed(2));

        return {
          studentId: st.id,
          studentName: st.name,
          rollNumber: st.rollNumber,
          status: isAbsent ? "absent" : "present",
          confidence: confidence,
          faceBox: {
            x: 50 + (idx % 4) * 120,
            y: 40 + Math.floor(idx / 4) * 110,
            width: 80,
            height: 95,
          },
          verified: true,
        };
      });

      setStudentsList(verifiedList);
      setUnknownFacesCount(1);
      setAnalysisComplete(true);
    } catch (err) {
      console.error("AI identification error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Teacher manual override toggle
  function toggleStudentStatus(studentId: string, newStatus: "present" | "absent" | "late") {
    setStudentsList((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, status: newStatus } : item
      )
    );
  }

  // Save attendance locally to Dexie and sync if online
  async function handleSubmitAttendance() {
    if (studentsList.length === 0) return;
    setIsSubmitting(true);

    const currentClass = classes.find((c) => c.id === selectedClassId);
    const totalPresent = studentsList.filter((s) => s.status === "present").length;
    const totalAbsent = studentsList.filter((s) => s.status === "absent").length;
    const sessionId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newSession: OfflineAttendanceRecord = {
      sessionId,
      classId: selectedClassId,
      className: currentClass?.name || "Class",
      section: currentClass?.section || "A",
      date: selectedDate,
      photoDataUrl: capturedPhoto || undefined,
      records: studentsList,
      totalPresent,
      totalAbsent,
      takenBy: "Teacher (Class In-Charge)",
      synced: false,
      createdAt: Date.now(),
    };

    try {
      // 1. Always save locally to IndexedDB first
      await offlineDb.attendanceQueue.add(newSession);

      // 2. If online, attempt immediate sync
      if (navigator.onLine) {
        setFeedbackMessage("Saving and synchronizing with central server...");
        await syncPendingAttendance();
      } else {
        setFeedbackMessage("Saved offline! Will automatically sync when connection returns.");
      }

      setTimeout(() => {
        router.push("/admin/attendance");
      }, 1200);
    } catch (err: any) {
      console.error("Error saving attendance record:", err);
      setFeedbackMessage("Error storing attendance session.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const presentCount = studentsList.filter((s) => s.status === "present").length;
  const absentCount = studentsList.filter((s) => s.status === "absent").length;
  const lateCount = studentsList.filter((s) => s.status === "late").length;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="min-w-0 flex-1 p-6 md:p-8">
        <DashboardHeader />

        {/* Back Link & Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/attendance"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary mb-2 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Attendance History
            </Link>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Camera className="text-primary" size={26} />
              AI Classroom Attendance Capture
            </h1>
            <p className="text-sm text-muted">
              Capture or upload a classroom photo. AI detects enrolled faces, and the teacher verifies the final count.
            </p>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Select Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setCapturedPhoto(null);
                setAnalysisComplete(false);
                setStudentsList([]);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} (Section {cls.section})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Attendance Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Operation Mode
            </label>
            <div className="flex items-center h-10 px-3 rounded-lg bg-light-green/60 text-xs font-semibold text-primary">
              <ShieldCheck size={16} className="mr-1.5 text-secondary" />
              Offline-Ready (IndexedDB Protected)
            </div>
          </div>
        </div>

        {/* Main Grid: Photo Capture Left / AI Verification Right */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Camera / Photo Capture (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <h2 className="text-base font-bold text-foreground mb-3 flex items-center justify-between">
                <span>Classroom Image</span>
                {capturedPhoto && (
                  <button
                    onClick={() => {
                      setCapturedPhoto(null);
                      setAnalysisComplete(false);
                      setStudentsList([]);
                      stopCamera();
                    }}
                    className="text-xs font-medium text-danger hover:underline cursor-pointer"
                  >
                    Retake / Clear
                  </button>
                )}
              </h2>

              {/* Viewport Box */}
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg border border-dashed border-border bg-slate-900 flex items-center justify-center">
                {/* Live Video Element - always mounted in DOM so videoRef.current is never null */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${
                    isCameraActive ? "block" : "hidden"
                  }`}
                />

                {isCameraActive && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span>Live ({facingMode === "user" ? "Front Webcam" : "Rear Camera"})</span>
                  </div>
                )}

                {!isCameraActive && capturedPhoto ? (
                  <div className="relative h-full w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={capturedPhoto}
                      alt="Classroom Snapshot"
                      className="h-full w-full object-contain"
                    />

                    {/* AI Bounding Boxes Overlay */}
                    {analysisComplete &&
                      studentsList.map((st, i) => (
                        <div
                          key={st.studentId}
                          style={{
                            top: `${20 + (i % 3) * 25}%`,
                            left: `${15 + (i % 4) * 20}%`,
                            width: "16%",
                            height: "22%",
                          }}
                          className={`absolute rounded border-2 ${
                            st.status === "present"
                              ? "border-emerald-500 bg-emerald-500/20"
                              : "border-red-500 bg-red-500/20"
                          } pointer-events-none flex items-start justify-start p-0.5`}
                        >
                          <span className="rounded bg-black/75 px-1 text-[9px] font-semibold text-white truncate max-w-full">
                            {st.studentName.split(" ")[0]} ({Math.round((st.confidence || 0.9) * 100)}%)
                          </span>
                        </div>
                      ))}

                    {/* Unknown face overlay tag */}
                    {analysisComplete && unknownFacesCount > 0 && (
                      <div
                        style={{ top: "60%", left: "75%", width: "16%", height: "20%" }}
                        className="absolute rounded border-2 border-amber-400 bg-amber-400/20 pointer-events-none p-0.5"
                      >
                        <span className="rounded bg-black/80 px-1 text-[9px] font-bold text-amber-300">
                          Unenrolled
                        </span>
                      </div>
                    )}
                  </div>
                ) : !isCameraActive && (
                  <div className="text-center p-6 text-slate-400">
                    <Camera size={44} className="mx-auto mb-2 opacity-60" />
                    <p className="text-sm font-medium">No Image Selected</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Start your camera or upload a photo to identify students.
                    </p>
                  </div>
                )}

                {/* AI Analyzing Spinner Overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                    <Sparkles className="animate-spin text-emerald-400 mb-2" size={32} />
                    <p className="text-sm font-semibold">AI Analyzing Faces...</p>
                    <p className="text-xs text-slate-300 mt-1">
                      Matching facial features with enrolled students
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {isCameraActive ? (
                  <div className="flex-1 flex gap-2">
                    <button
                      onClick={captureSnapshot}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                    >
                      <Camera size={18} />
                      <span>Capture Snapshot</span>
                    </button>

                    <button
                      type="button"
                      onClick={flipCamera}
                      title="Switch Camera (Front / Rear)"
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground hover:bg-light-green transition cursor-pointer"
                    >
                      <SwitchCamera size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={stopCamera}
                      title="Stop Camera"
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-danger hover:bg-red-50 transition cursor-pointer"
                    >
                      <VideoOff size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startCamera()}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition cursor-pointer"
                  >
                    <Camera size={18} />
                    <span>Open Camera</span>
                  </button>
                )}

                <label className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-light-green hover:text-primary transition cursor-pointer">
                  <Upload size={18} />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {cameraError && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>

            {/* Hidden canvas for capturing bitmap */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Right Column: Teacher Verification & Student Roster (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex-1 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-border gap-2">
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="text-primary" size={20} />
                    Teacher Verification Roster
                  </h2>
                  <p className="text-xs text-muted">
                    Review and override AI suggestions before saving records.
                  </p>
                </div>

                {analysisComplete && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 font-bold">
                      {presentCount} Present
                    </span>
                    <span className="rounded-full bg-red-100 text-red-800 px-2.5 py-0.5 font-bold">
                      {absentCount} Absent
                    </span>
                    {lateCount > 0 && (
                      <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 font-bold">
                        {lateCount} Late
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Roster List Body */}
              <div className="mt-3 flex-1 overflow-y-auto max-h-[460px] divide-y divide-border">
                {studentsList.length > 0 ? (
                  studentsList.map((st) => (
                    <div
                      key={st.studentId}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-lg transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-muted bg-slate-100 px-1.5 py-0.5 rounded">
                            #{st.rollNumber}
                          </span>
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {st.studentName}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          {st.confidence && st.confidence > 0.5 ? (
                            <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                              <Sparkles size={11} /> AI Match: {Math.round(st.confidence * 100)}%
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              Manual Check Required
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Toggle Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleStudentStatus(st.studentId, "present")}
                          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                            st.status === "present"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800"
                          }`}
                        >
                          <Check size={12} /> Present
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleStudentStatus(st.studentId, "absent")}
                          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                            st.status === "absent"
                              ? "bg-red-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-800"
                          }`}
                        >
                          <X size={12} /> Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleStudentStatus(st.studentId, "late")}
                          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                            st.status === "late"
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800"
                          }`}
                        >
                          <Clock size={12} /> Late
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center text-muted">
                    <Users size={38} className="mx-auto mb-2 opacity-40 text-primary" />
                    <p className="text-sm font-medium">No Students Loaded for Verification</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Capture or upload a classroom photo on the left. The AI engine will populate the enrolled student attendance list for your confirmation.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit / Confirm Button */}
              {studentsList.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-muted">
                    {feedbackMessage ? (
                      <span className="font-semibold text-primary">{feedbackMessage}</span>
                    ) : (
                      <span>All overrides will be recorded with your teacher credential.</span>
                    )}
                  </div>

                  <button
                    onClick={handleSubmitAttendance}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Saving Record...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        <span>Confirm & Record Attendance</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

