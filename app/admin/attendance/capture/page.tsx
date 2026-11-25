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
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Users,
  ShieldCheck,
  Check,
  X,
  Clock,
  Calendar,
  SwitchCamera,
  VideoOff,
  UserCheck,
  UserX,
  HelpCircle,
} from "lucide-react";
import {
  offlineDb,
  OfflineClass,
  OfflineStudent,
  AttendanceStudentItem,
  OfflineAttendanceRecord,
} from "@/lib/offlineDb";
import { initializeOfflineDatabase, syncPendingAttendance } from "@/lib/syncService";
import {
  matchClassroomFaces,
  loadFaceRecognitionModels,
  FaceMatchResult,
} from "@/lib/faceRecognition";
import { useAuth } from "@/lib/authContext";
import { useLanguage } from "@/lib/languageContext";

export default function AttendanceCapturePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Form State
  const [classes, setClasses] = useState<OfflineClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [maxDate, setMaxDate] = useState<string>("");
  const [enrolledStudents, setEnrolledStudents] = useState<OfflineStudent[]>([]);
  const [existingSession, setExistingSession] = useState<OfflineAttendanceRecord | null>(null);
  const [dateStatus, setDateStatus] = useState<"today" | "recorded" | "unrecorded_past" | "future">("today");

  // Camera / Media State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // AI & Verification State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false);
  const [matchedFaceBoxes, setMatchedFaceBoxes] = useState<FaceMatchResult[]>([]);
  const [studentsList, setStudentsList] = useState<AttendanceStudentItem[]>([]);
  const [unknownFacesCount, setUnknownFacesCount] = useState<number>(0);
  const [totalFacesDetected, setTotalFacesDetected] = useState<number>(0);
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

  // Load classes & initial class roster on mount
  useEffect(() => {
    async function loadInitialData() {
      await initializeOfflineDatabase();
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
      setMaxDate(today);
      loadFaceRecognitionModels().catch(console.warn);

      const loadedClasses = await offlineDb.classes.toArray();
      setClasses(loadedClasses);

      if (loadedClasses.length > 0) {
        const urlClassId =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("classId")
            : null;
        const urlClass = urlClassId
          ? loadedClasses.find((c) => c.id === urlClassId)
          : null;
        const matchingClass = user?.assignedClass
          ? loadedClasses.find((c) => c.name === user.assignedClass)
          : null;
        const initialClassId = urlClass
          ? urlClass.id
          : matchingClass
          ? matchingClass.id
          : loadedClasses[0].id;
        setSelectedClassId(initialClassId);
        await loadAttendanceForClassAndDate(initialClassId, today);
      }
    }
    loadInitialData();

    return () => {
      stopCamera();
    };
  }, []);

  // Load attendance and student roster specifically for the chosen class and date
  async function loadAttendanceForClassAndDate(classId: string, date: string) {
    if (!classId) return;

    // 1. Load enrolled students for this class
    const students = await offlineDb.students
      .where("classId")
      .equals(classId)
      .toArray();
    setEnrolledStudents(students);

    const todayStr = new Date().toISOString().split("T")[0];

    // 2. Prevent/flag future date attendance
    if (date > todayStr) {
      setDateStatus("future");
      setExistingSession(null);
      setCapturedPhoto(null);
      setMatchedFaceBoxes([]);
      setAnalysisComplete(false);
      setStudentsList(
        students.map((s) => ({
          studentId: s.id,
          studentName: s.name,
          rollNumber: s.rollNumber,
          photoUrl: s.facePhotoUrl,
          status: "absent",
          confidence: 0,
          verified: false,
        }))
      );
      return;
    }

    // 3. Query existing attendance record for this exact date and class
    const existing = await offlineDb.attendanceQueue
      .where("date")
      .equals(date)
      .toArray()
      .then((list) => list.find((s) => s.classId === classId));

    if (existing) {
      // Existing record found for this date
      setDateStatus("recorded");
      setExistingSession(existing);
      setCapturedPhoto(existing.photoDataUrl || null);
      setMatchedFaceBoxes([]);
      setAnalysisComplete(true);

      const recordedMap = new Map<string, AttendanceStudentItem>();
      existing.records.forEach((r) => recordedMap.set(r.studentId, r));

      const roster: AttendanceStudentItem[] = students.map((s) => {
        const rec = recordedMap.get(s.id);
        if (rec) {
          return {
            ...rec,
            photoUrl: s.facePhotoUrl || rec.photoUrl,
          };
        }
        return {
          studentId: s.id,
          studentName: s.name,
          rollNumber: s.rollNumber,
          photoUrl: s.facePhotoUrl,
          status: "absent",
          confidence: 0,
          verified: true,
        };
      });

      setStudentsList(roster);
    } else {
      // No existing record for this date
      setDateStatus(date === todayStr ? "today" : "unrecorded_past");
      setExistingSession(null);
      setCapturedPhoto(null);
      setMatchedFaceBoxes([]);
      setAnalysisComplete(false);

      const initialRoster: AttendanceStudentItem[] = students.map((s) => ({
        studentId: s.id,
        studentName: s.name,
        rollNumber: s.rollNumber,
        photoUrl: s.facePhotoUrl,
        status: "absent",
        confidence: 0,
        verified: true,
      }));

      setStudentsList(initialRoster);
    }
  }

  // Handle Class Selector Change
  async function handleClassChange(newClassId: string) {
    setSelectedClassId(newClassId);
    stopCamera();
    await loadAttendanceForClassAndDate(newClassId, selectedDate);
  }

  // Handle Date Selector Change
  async function handleDateChange(newDate: string) {
    setSelectedDate(newDate);
    stopCamera();
    await loadAttendanceForClassAndDate(selectedClassId, newDate);
  }

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
  async function captureSnapshot() {
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
      await runFaceRecognition(canvas);
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

      const img = new Image();
      img.onload = () => {
        runFaceRecognition(img);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  }

  // Real Enrollment-Based Face Recognition & Student Matching
  async function runFaceRecognition(source: HTMLCanvasElement | HTMLImageElement) {
    setIsAnalyzing(true);
    setAnalysisComplete(false);

    try {
      // 1. Fetch current enrolled students of the selected class
      const currentStudents = await offlineDb.students
        .where("classId")
        .equals(selectedClassId)
        .toArray();

      setEnrolledStudents(currentStudents);

      // 2. Perform Real Multi-Face Recognition comparing against enrolled reference embeddings
      const {
        matchedDetections,
        attendanceRoster,
        totalFacesDetected: totalFaces,
        unknownFacesCount: unknownCount,
      } = await matchClassroomFaces(source, currentStudents, 0.55);

      setMatchedFaceBoxes(matchedDetections);
      setTotalFacesDetected(totalFaces);
      setUnknownFacesCount(unknownCount);

      // 3. Update attendance roster
      const updatedList: AttendanceStudentItem[] = attendanceRoster.map((item) => ({
        studentId: item.studentId,
        studentName: item.studentName,
        rollNumber: item.rollNumber,
        photoUrl: item.photoUrl,
        status: item.status,
        confidence: item.confidence,
        faceBox: item.matchedBox,
        verified: true,
      }));

      setStudentsList(updatedList);
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

  // Save or update attendance locally to Dexie and sync if online
  async function handleSubmitAttendance() {
    if (studentsList.length === 0) return;
    if (dateStatus === "future") {
      setFeedbackMessage(
        language === "hi"
          ? "भविष्य की तारीख की उपस्थिति दर्ज नहीं की जा सकती।"
          : "Cannot record attendance for a future date."
      );
      return;
    }

    setIsSubmitting(true);

    const currentClass = classes.find((c) => c.id === selectedClassId);
    const totalPresent = studentsList.filter((s) => s.status === "present").length;
    const totalAbsent = studentsList.filter((s) => s.status === "absent").length;
    const sessionId = existingSession?.sessionId || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newSession: OfflineAttendanceRecord = {
      sessionId,
      classId: selectedClassId,
      className: currentClass?.name || "Class",
      section: currentClass?.section || "A",
      date: selectedDate,
      photoDataUrl: capturedPhoto || existingSession?.photoDataUrl || undefined,
      records: studentsList,
      totalPresent,
      totalAbsent,
      takenBy: user
        ? `${user.name} (${user.role === "admin" ? "Principal" : "Faculty"})`
        : (existingSession?.takenBy || "Teacher (Class In-Charge)"),
      synced: false,
      createdAt: existingSession?.createdAt || Date.now(),
    };

    try {
      // 1. Update existing record if it already exists for this date, or insert new
      if (existingSession && existingSession.id) {
        await offlineDb.attendanceQueue.update(existingSession.id, {
          records: studentsList,
          totalPresent,
          totalAbsent,
          photoDataUrl: capturedPhoto || existingSession.photoDataUrl,
          takenBy: newSession.takenBy,
          synced: false,
        });
      } else {
        await offlineDb.attendanceQueue.add(newSession);
      }

      // 2. If online, attempt immediate sync
      if (navigator.onLine) {
        setFeedbackMessage("Saving and synchronizing with central server...");
        await syncPendingAttendance();
      } else {
        setFeedbackMessage(
          language === "hi"
            ? `${selectedDate} की उपस्थिति ऑफ़लाइन सुरक्षित हो गई!`
            : `Attendance for ${selectedDate} saved offline!`
        );
      }

      // 3. Reload state for this date
      await loadAttendanceForClassAndDate(selectedClassId, selectedDate);

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
  const enrolledCount = enrolledStudents.length;
  const enrolledWithFaces = enrolledStudents.filter(
    (s) => s.faceEmbedding && s.faceEmbedding.length === 128
  ).length;

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
              AI Face Recognition Classroom Attendance
            </h1>
            <p className="text-sm text-muted">
              Select class and capture classroom photo. AI detects individual faces and matches exclusively against enrolled student profiles.
            </p>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Select Class & Section *
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
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
              max={maxDate || undefined}
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Enrolled Face Profiles
            </label>
            <div className="flex items-center justify-between h-10 px-3 rounded-lg bg-light-green/60 text-xs font-semibold text-primary">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-secondary" />
                {enrolledWithFaces} of {enrolledCount} Faces Enrolled
              </span>
              {enrolledWithFaces < enrolledCount && (
                <Link
                  href="/admin/students"
                  className="text-[11px] underline text-primary hover:text-emerald-800"
                >
                  Enroll Missing
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Day-Wise Status Notification Banner */}
        <div className="mb-6">
          {dateStatus === "future" && (
            <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-xs text-red-900 shadow-2xs">
              <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm block">
                  {language === "hi" ? "भविष्य की तारीख चुनी गई है" : "Future Date Selected"} ({selectedDate})
                </span>
                <p className="mt-0.5 text-red-800">
                  {language === "hi"
                    ? "उपस्थिति अग्रिम में दर्ज नहीं की जा सकती। कृपया आज की या किसी पिछली तारीख का चयन करें।"
                    : "Attendance cannot be marked in advance for future dates. Please select today or a past date."}
                </p>
              </div>
            </div>
          )}

          {dateStatus === "recorded" && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 text-xs text-emerald-950 shadow-2xs">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-sm block text-emerald-900">
                    {language === "hi"
                      ? `दिनांक ${selectedDate} की उपस्थिति पहले से दर्ज है`
                      : `Attendance Already Recorded for ${selectedDate}`}
                  </span>
                  <p className="mt-0.5 text-emerald-800">
                    {existingSession?.takenBy ? `Recorded by: ${existingSession.takenBy}` : "Verified session"} •{" "}
                    <span className="font-semibold text-emerald-900">{existingSession?.totalPresent} Present</span>,{" "}
                    <span className="font-semibold text-red-800">{existingSession?.totalAbsent} Absent</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-200/80 px-2.5 py-1 text-[11px] font-bold text-emerald-900">
                  {language === "hi" ? "सहेजा गया रिकॉर्ड" : "Viewing Saved Record"}
                </span>
              </div>
            </div>
          )}

          {dateStatus === "unrecorded_past" && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 shadow-2xs">
              <Calendar size={18} className="text-amber-600 shrink-0" />
              <div>
                <span className="font-bold block">
                  {language === "hi"
                    ? `दिनांक ${selectedDate} को कोई उपस्थिति दर्ज नहीं की गई थी`
                    : `No Attendance Recorded on ${selectedDate}`}
                </span>
                <span className="text-amber-800">
                  {language === "hi"
                    ? "आप तस्वीर खींचकर या सूची सत्यापित करके पिछली छूटी हुई उपस्थिति दर्ज कर सकते हैं।"
                    : "You can capture a photo or mark the roster below to record missed attendance for this past date."}
                </span>
              </div>
            </div>
          )}

          {dateStatus === "today" && (
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-light-green/40 p-3 text-xs text-primary shadow-2xs">
              <Calendar size={17} className="text-primary shrink-0" />
              <span>
                {language === "hi"
                  ? `आज का उपस्थिति सत्र (${selectedDate}) — कक्षा की तस्वीर लें या विद्यार्थियों की उपस्थिति सत्यापित करें।`
                  : `Today's Attendance Session (${selectedDate}) — Capture classroom photo or verify student roster below.`}
              </span>
            </div>
          )}
        </div>

        {/* Main Grid: Photo Capture Left / AI Verification Right */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Camera / Photo Capture (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <h2 className="text-base font-bold text-foreground mb-3 flex items-center justify-between">
                <span>Classroom Snapshot</span>
                {capturedPhoto && (
                  <button
                    onClick={() => {
                      setCapturedPhoto(null);
                      setAnalysisComplete(false);
                      setMatchedFaceBoxes([]);
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
                {/* Live Video Element */}
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

                    {/* Real AI Multi-Face Bounding Boxes Overlay */}
                    {analysisComplete &&
                      matchedFaceBoxes.map((face, i) => {
                        return (
                          <div
                            key={i}
                            style={{
                              top: `${face.box.y}%`,
                              left: `${face.box.x}%`,
                              width: `${face.box.width}%`,
                              height: `${face.box.height}%`,
                            }}
                            className={`absolute rounded border-2 ${
                              face.isUnknown
                                ? "border-amber-400 bg-amber-400/20"
                                : "border-emerald-500 bg-emerald-500/25"
                            } pointer-events-none flex items-start justify-start p-1 shadow-md`}
                          >
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white truncate max-w-full shadow-xs ${
                                face.isUnknown ? "bg-amber-600/90" : "bg-emerald-900/90"
                              }`}
                            >
                              {face.isUnknown
                                ? "Unknown / Unenrolled"
                                : `${face.matchedStudentName} (${Math.round(face.confidence * 100)}%)`}
                            </span>
                          </div>
                        );
                      })}

                    {analysisComplete && totalFacesDetected === 0 && (
                      <div className="absolute inset-x-4 bottom-4 rounded-lg bg-black/85 p-3 text-center text-xs text-amber-300 backdrop-blur-xs border border-amber-500/30">
                        ⚠️ No human faces detected in this image. All students marked absent.
                      </div>
                    )}
                  </div>
                ) : !isCameraActive && (
                  <div className="text-center p-6 text-slate-400">
                    <Camera size={44} className="mx-auto mb-2 opacity-60" />
                    <p className="text-sm font-medium">No Image Selected</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Start your camera or upload a photo to identify enrolled students.
                    </p>
                  </div>
                )}

                {/* AI Analyzing Spinner Overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                    <Sparkles className="animate-spin text-emerald-400 mb-2" size={32} />
                    <p className="text-sm font-semibold">AI Face Recognition in Progress...</p>
                    <p className="text-xs text-slate-300 mt-1">
                      Extracting 128-D face embeddings & matching with enrolled students
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
                    Verified match against enrolled students of this class. Teacher can review and override.
                  </p>
                </div>

                {analysisComplete && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="rounded-full bg-slate-100 text-slate-800 px-2.5 py-0.5 font-bold border border-slate-200">
                      {totalFacesDetected} {totalFacesDetected === 1 ? "Face Detected" : "Faces Detected"}
                    </span>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 font-bold">
                      {presentCount} Present
                    </span>
                    <span className="rounded-full bg-red-100 text-red-800 px-2.5 py-0.5 font-bold">
                      {absentCount} Absent
                    </span>
                    {unknownFacesCount > 0 && (
                      <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 font-bold">
                        {unknownFacesCount} Unknown
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Status Notice if faces detected vs enrolled */}
              {analysisComplete && enrolledWithFaces === 0 && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <HelpCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">No enrolled reference face profiles for this class!</span>
                    <p className="mt-0.5">
                      To enable AI face recognition, please visit the{" "}
                      <Link href="/admin/students" className="underline font-bold text-primary">
                        Student Directory
                      </Link>{" "}
                      and enroll photos for your students.
                    </p>
                  </div>
                </div>
              )}

              {/* Roster List Body */}
              <div className="mt-3 flex-1 overflow-y-auto max-h-[460px] divide-y divide-border">
                {studentsList.length > 0 ? (
                  studentsList.map((st) => (
                    <div
                      key={st.studentId}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-lg transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Student Enrolled Photo */}
                        {st.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={st.photoUrl}
                            alt={st.studentName}
                            className="h-10 w-10 rounded-full object-cover border-2 border-emerald-500 shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold text-xs shrink-0 border border-border">
                            {st.studentName.charAt(0)}
                          </div>
                        )}

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
                            {st.status === "present" && st.confidence && st.confidence > 0 ? (
                              <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                                <Sparkles size={11} /> Face Match: {Math.round(st.confidence * 100)}%
                              </span>
                            ) : st.status === "present" ? (
                              <span className="text-[11px] text-primary flex items-center gap-1 font-medium">
                                <CheckCircle size={11} /> Teacher Verified
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Not detected in image
                              </span>
                            )}
                          </div>
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
                    <p className="text-sm font-medium">No Students in this Class</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Please enroll students into this class first from the Student Directory.
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
                      <span>
                        Summary: {presentCount} Present, {absentCount} Absent
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleSubmitAttendance}
                    disabled={isSubmitting || dateStatus === "future"}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold text-white transition shadow-xs ${
                      dateStatus === "future"
                        ? "bg-slate-400 cursor-not-allowed opacity-60"
                        : dateStatus === "recorded"
                        ? "bg-emerald-700 hover:bg-emerald-800 cursor-pointer"
                        : "bg-primary hover:bg-emerald-800 cursor-pointer"
                    } disabled:opacity-50`}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Saving Record...</span>
                      </>
                    ) : dateStatus === "future" ? (
                      <span>
                        {language === "hi"
                          ? "भविष्य की तारीख में दर्ज नहीं कर सकते"
                          : "Cannot Record for Future Date"}
                      </span>
                    ) : dateStatus === "recorded" ? (
                      <>
                        <CheckCircle size={16} />
                        <span>
                          {language === "hi"
                            ? `उपस्थिति अपडेट करें (${selectedDate})`
                            : `Update Attendance (${selectedDate})`}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        <span>{t.confirmAttendance}</span>
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
