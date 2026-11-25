"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Lock,
  ArrowLeft,
  KeyRound,
  UserCheck,
  Globe,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useLanguage } from "@/lib/languageContext";
import { offlineDb, OfflineTeacher } from "@/lib/offlineDb";
import { initializeOfflineDatabase } from "@/lib/syncService";

export default function TeacherLoginPage() {
  const router = useRouter();
  const { loginTeacher } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [teachers, setTeachers] = useState<OfflineTeacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [manualIdentifier, setManualIdentifier] = useState<string>("");
  const [passwordOrPin, setPasswordOrPin] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [useQuickSelect, setUseQuickSelect] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function loadTeachers() {
      await initializeOfflineDatabase();
      const list = await offlineDb.teachers.toArray();
      setTeachers(list);
      if (list.length > 0) {
        setSelectedTeacherId(list[0].id);
      }
    }
    loadTeachers();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const identifier = useQuickSelect ? selectedTeacherId : manualIdentifier;

    if (!identifier) {
      setErrorMessage(
        language === "hi"
          ? "कृपया शिक्षक का चयन करें या ईमेल/फोन दर्ज करें"
          : "Please select a teacher or enter email/phone"
      );
      setIsSubmitting(false);
      return;
    }

    if (!passwordOrPin) {
      setErrorMessage(
        language === "hi"
          ? "कृपया अपना पासवर्ड या 4-अंकीय पिन दर्ज करें"
          : "Please enter your password or 4-digit PIN"
      );
      setIsSubmitting(false);
      return;
    }

    const res = await loginTeacher(identifier, passwordOrPin);
    setIsSubmitting(false);

    if (res.success) {
      router.push("/admin/attendance/capture");
    } else {
      setErrorMessage(res.error || (language === "hi" ? "अमान्य क्रेडेंशियल" : "Invalid credentials"));
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Navbar */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4 shadow-2xs">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary transition"
        >
          <ArrowLeft size={16} />
          <span>{t.backToLogin}</span>
        </Link>

        <button
          type="button"
          onClick={() => setLanguage(language === "en" ? "hi" : "en")}
          className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-light-green px-3 py-1.5 text-xs font-bold text-primary hover:bg-emerald-200 transition cursor-pointer"
        >
          <Globe size={14} />
          <span>{language === "en" ? "हिन्दी (HI)" : "English (EN)"}</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 shadow-sm">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-light-green text-primary shadow-xs">
              <GraduationCap size={28} />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-foreground">
              {t.teacherPortal}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {language === "hi"
                ? "कक्षा उपस्थिति लेने हेतु लॉग इन करें"
                : "Sign in to record classroom attendance"}
            </p>
          </div>

          {/* Quick Select vs Manual Toggle */}
          <div className="mb-5 flex rounded-lg bg-gray-100 p-1 text-xs font-semibold text-muted">
            <button
              type="button"
              onClick={() => {
                setUseQuickSelect(true);
                setErrorMessage("");
              }}
              className={`flex-1 rounded-md py-1.5 text-center transition ${
                useQuickSelect
                  ? "bg-white text-primary shadow-xs font-bold"
                  : "hover:text-foreground"
              }`}
            >
              {language === "hi" ? "त्वरित चयन (सूची से)" : "Quick Roster Select"}
            </button>
            <button
              type="button"
              onClick={() => {
                setUseQuickSelect(false);
                setErrorMessage("");
              }}
              className={`flex-1 rounded-md py-1.5 text-center transition ${
                !useQuickSelect
                  ? "bg-white text-primary shadow-xs font-bold"
                  : "hover:text-foreground"
              }`}
            >
              {language === "hi" ? "ईमेल / फोन नंबर" : "Email / Phone"}
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {useQuickSelect ? (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {t.selectTeacher}
                </label>
                <div className="relative">
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                  >
                    {teachers.map((tch) => (
                      <option key={tch.id} value={tch.id}>
                        {tch.name} ({tch.assignedClass || "Class In-Charge"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {t.emailOrPhone}
                </label>
                <input
                  type="text"
                  placeholder="e.g. sunita.d@school.gov.in"
                  value={manualIdentifier}
                  onChange={(e) => setManualIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>
            )}

            {/* Password or PIN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t.passwordOrPin}
                </label>
                <Link
                  href="/login/teacher/set-password"
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  {t.setYourPassword}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    language === "hi"
                      ? "अपना पासवर्ड या पिन दर्ज करें"
                      : "Enter password or 4-digit PIN"
                  }
                  value={passwordOrPin}
                  onChange={(e) => setPasswordOrPin(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white pl-3.5 pr-10 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <UserCheck size={16} />
              <span>{isSubmitting ? "..." : t.loginButton}</span>
            </button>
          </form>

          {/* Self-service Password Links */}
          <div className="mt-6 space-y-2 border-t border-border pt-4 text-center">
            <Link
              href="/login/teacher/set-password"
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <KeyRound size={14} />
              <span>{t.firstTimeTeacher}</span>
            </Link>

            <Link
              href="/login/teacher/register"
              className="flex items-center justify-center gap-1.5 text-xs text-muted hover:text-foreground"
            >
              <UserPlus size={14} />
              <span>{t.registerNewTeacher}</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
