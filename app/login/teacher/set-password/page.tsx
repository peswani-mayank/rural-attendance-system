"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Globe,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useLanguage } from "@/lib/languageContext";
import { offlineDb, OfflineTeacher } from "@/lib/offlineDb";
import { initializeOfflineDatabase } from "@/lib/syncService";

export default function TeacherSetPasswordPage() {
  const router = useRouter();
  const { setTeacherPassword } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [teachers, setTeachers] = useState<OfflineTeacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [manualEmail, setManualEmail] = useState<string>("");
  const [useSelect, setUseSelect] = useState<boolean>(true);
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
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

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const targetId = useSelect ? selectedTeacherId : manualEmail;

    if (!targetId) {
      setErrorMessage(
        language === "hi"
          ? "कृपया शिक्षक का चयन करें"
          : "Please select a teacher"
      );
      return;
    }

    if (!newPassword || newPassword.trim().length < 4) {
      setErrorMessage(
        language === "hi"
          ? "पासवर्ड कम से कम 4 अक्षरों या 4 अंकों का होना चाहिए"
          : "Password or PIN must be at least 4 characters long"
      );
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMessage(t.passwordsDoNotMatch);
      return;
    }

    setIsSubmitting(true);
    const res = await setTeacherPassword(targetId, newPassword);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(t.passwordSetSuccess);
      setTimeout(() => {
        router.push("/admin/attendance/capture");
      }, 1000);
    } else {
      setErrorMessage(res.error || "Failed to set password");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Navbar */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4 shadow-2xs">
        <Link
          href="/login/teacher"
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

      {/* Main Form */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 shadow-sm">
          <div className="text-center mb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-light-green text-primary shadow-xs">
              <KeyRound size={28} />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-foreground">
              {t.setYourPassword}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {language === "hi"
                ? "शिक्षक अपना नया पासवर्ड या 4-अंकीय पिन स्वयं बनाएं"
                : "Create your own secure password or 4-digit PIN"}
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-green-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSetPassword} className="space-y-4">
            {/* Select Teacher Profile */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t.selectTeacher}
                </label>
                <button
                  type="button"
                  onClick={() => setUseSelect(!useSelect)}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  {useSelect
                    ? (language === "hi" ? "ईमेल से खोजें" : "Enter Email")
                    : (language === "hi" ? "सूची से चुनें" : "Select from List")}
                </button>
              </div>

              {useSelect ? (
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                >
                  {teachers.map((tch) => (
                    <option key={tch.id} value={tch.id}>
                      {tch.name} ({tch.assignedClass || "Faculty"}) - {tch.email}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="email"
                  placeholder="e.g. sunita.d@school.gov.in"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
              )}
            </div>

            {/* New Password / PIN */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                {t.newPassword} / 4-Digit PIN
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    language === "hi"
                      ? "नया पासवर्ड या 4-अंकीय पिन"
                      : "Enter new password or 4-digit PIN"
                  }
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              <p className="mt-1 text-[11px] text-muted">
                {language === "hi"
                  ? "सुझाव: त्वरित लॉगिन के लिए 4 अंकों का पिन (जैसे 4821) रख सकते हैं"
                  : "Tip: You can use a 4-digit PIN (e.g. 4821) for fast classroom logins."}
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                {t.confirmPassword}
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder={
                  language === "hi"
                    ? "पासवर्ड की दोबारा पुष्टि करें"
                    : "Re-enter new password to confirm"
                }
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? "..." : t.saveAndLogin}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted">
            <Link
              href="/login/teacher"
              className="font-semibold text-primary hover:underline"
            >
              {language === "hi"
                ? "पहले से पासवर्ड है? सीधे लॉगिन करें"
                : "Already know your password? Sign in"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
