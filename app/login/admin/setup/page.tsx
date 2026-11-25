"use client";

import { useState } from "react";
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
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useLanguage } from "@/lib/languageContext";

export default function AdminSetupPage() {
  const router = useRouter();
  const { setAdminPassword } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [email, setEmail] = useState<string>("admin@school.gov.in");
  const [adminName, setAdminName] = useState<string>("Principal (Administrator)");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  async function handleSetAdminPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email) {
      setErrorMessage("Please enter an official administrator email");
      return;
    }

    if (!newPassword || newPassword.trim().length < 4) {
      setErrorMessage(
        language === "hi"
          ? "पासवर्ड कम से कम 4 अक्षरों का होना चाहिए"
          : "Password must be at least 4 characters long"
      );
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMessage(t.passwordsDoNotMatch);
      return;
    }

    setIsSubmitting(true);
    const res = await setAdminPassword(email, newPassword, adminName);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(t.passwordSetSuccess);
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1000);
    } else {
      setErrorMessage(res.error || "Failed to save administrator password");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4 shadow-2xs">
        <Link
          href="/login/admin"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-emerald-800 transition"
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 shadow-xs">
              <KeyRound size={28} />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-foreground">
              {language === "hi"
                ? "व्यवस्थापक पासवर्ड सेट करें"
                : "Set Administrator Password"}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {language === "hi"
                ? "प्रधानाध्यापक अपना व्यक्तिगत मास्टर पासवर्ड स्वयं तय करें"
                : "Set your own administrative master password"}
            </p>
          </div>

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

          <form onSubmit={handleSetAdminPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                {language === "hi" ? "अधिकारी / पदनाम" : "Administrator Name / Title"}
              </label>
              <input
                type="text"
                placeholder="e.g. Principal (Headmaster)"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-800 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                {language === "hi" ? "आधिकारिक ईमेल" : "Official Admin Email"}
              </label>
              <input
                type="email"
                placeholder="admin@school.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-800 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                {t.newPassword}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    language === "hi"
                      ? "नया व्यवस्थापक पासवर्ड दर्ज करें"
                      : "Enter new secure admin password"
                  }
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-white pl-3.5 pr-10 py-2.5 text-sm text-foreground focus:border-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-800 shadow-2xs"
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
                required
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-800 shadow-2xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 py-3 text-sm font-bold text-white hover:bg-emerald-900 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>{isSubmitting ? "..." : t.saveAndLogin}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted">
            <Link
              href="/login/admin"
              className="font-semibold text-emerald-800 hover:underline"
            >
              {language === "hi"
                ? "लॉगिन पृष्ठ पर वापस जाएं"
                : "Back to Administrator Login"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
