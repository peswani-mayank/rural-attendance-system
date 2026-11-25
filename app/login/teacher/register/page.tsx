"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
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
import { offlineDb, OfflineClass } from "@/lib/offlineDb";
import { initializeOfflineDatabase } from "@/lib/syncService";

export default function TeacherRegisterPage() {
  const router = useRouter();
  const { registerTeacher } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [classes, setClasses] = useState<OfflineClass[]>([]);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [assignedClass, setAssignedClass] = useState<string>("Grade 5-A");
  const [subject, setSubject] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function loadClasses() {
      await initializeOfflineDatabase();
      const cls = await offlineDb.classes.toArray();
      setClasses(cls);
      if (cls.length > 0) {
        setAssignedClass(cls[0].name);
      }
    }
    loadClasses();
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!name || !email || !password) {
      setErrorMessage(
        language === "hi"
          ? "कृपया नाम, ईमेल और पासवर्ड दर्ज करें"
          : "Please fill in name, email and password"
      );
      return;
    }

    if (password.trim() !== confirmPassword.trim()) {
      setErrorMessage(t.passwordsDoNotMatch);
      return;
    }

    if (password.trim().length < 4) {
      setErrorMessage(
        language === "hi"
          ? "पासवर्ड कम से कम 4 अक्षरों का होना चाहिए"
          : "Password must be at least 4 characters long"
      );
      return;
    }

    setIsSubmitting(true);
    const res = await registerTeacher({
      name,
      email,
      phone,
      assignedClass,
      subject,
      password,
    });
    setIsSubmitting(false);

    if (res.success) {
      router.push("/admin/attendance/capture");
    } else {
      setErrorMessage(res.error || "Failed to register teacher");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
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

      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 shadow-sm">
          <div className="text-center mb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-light-green text-primary shadow-xs">
              <UserPlus size={28} />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-foreground">
              {t.registerNewTeacher}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {language === "hi"
                ? "नया शिक्षक पंजीयन एवं स्व-पासवर्ड निर्माण"
                : "Register faculty profile with your own password"}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {t.fullName} *
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Chandra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  placeholder="ramesh@school.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="+91 94140 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {t.assignedClass}
                </label>
                <select
                  value={assignedClass}
                  onChange={(e) => setAssignedClass(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none shadow-2xs"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Science / General"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {t.newPassword} *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    language === "hi"
                      ? "कम से कम 4 अक्षर या 4-अंकीय पिन"
                      : "At least 4 characters or 4-digit PIN"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-white pl-3.5 pr-10 py-2 text-sm text-foreground focus:border-primary focus:outline-none shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {t.confirmPassword} *
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t.confirmPassword}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none shadow-2xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? "..." : t.registerButton}</span>
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-muted">
            <Link
              href="/login/teacher"
              className="font-semibold text-primary hover:underline"
            >
              {language === "hi"
                ? "पहले से पंजीकृत हैं? लॉग इन करें"
                : "Already registered? Sign In"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
