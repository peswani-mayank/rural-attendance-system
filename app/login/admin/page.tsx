"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  KeyRound,
  Globe,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useLanguage } from "@/lib/languageContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [email, setEmail] = useState<string>("admin@school.gov.in");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    if (!email || !password) {
      setErrorMessage(
        language === "hi"
          ? "कृपया ईमेल और पासवर्ड दोनों दर्ज करें"
          : "Please enter both email and password"
      );
      setIsSubmitting(false);
      return;
    }

    const res = await loginAdmin(email, password);
    setIsSubmitting(false);

    if (res.success) {
      router.push("/admin/dashboard");
    } else {
      setErrorMessage(
        res.error ||
          (language === "hi"
            ? "गलत व्यवस्थापक क्रेडेंशियल"
            : "Invalid administrator credentials")
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4 shadow-2xs">
        <Link
          href="/login"
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
              <ShieldCheck size={28} />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-foreground">
              {t.adminPortal}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {language === "hi"
                ? "विद्यालय प्रबंधन व नियंत्रण हेतु लॉग इन करें"
                : "Sign in to manage faculty, students & school reports"}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                {language === "hi" ? "व्यवस्थापक ईमेल" : "Administrator Email"}
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {language === "hi" ? "पासवर्ड" : "Password"}
                </label>
                <Link
                  href="/login/admin/setup"
                  className="text-[11px] font-semibold text-emerald-800 hover:underline"
                >
                  {t.setYourPassword}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    language === "hi"
                      ? "अपना व्यवस्थापक पासवर्ड दर्ज करें"
                      : "Enter administrator password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 py-3 text-sm font-bold text-white hover:bg-emerald-900 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>{isSubmitting ? "..." : t.loginButton}</span>
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center">
            <Link
              href="/login/admin/setup"
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 hover:underline"
            >
              <KeyRound size={14} />
              <span>{t.firstTimeAdmin}</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
