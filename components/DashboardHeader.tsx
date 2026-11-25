"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Search,
  UserCircle,
  Globe,
  LogOut,
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import SyncStatusBadge from "@/components/SyncStatusBadge";
import { useLanguage } from "@/lib/languageContext";
import { useAuth } from "@/lib/authContext";

export default function DashboardHeader() {
  const { language, setLanguage, t } = useLanguage();
  const { user, role, logout, setTeacherPassword, setAdminPassword } = useAuth();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>("");
  const [modalSuccess, setModalSuccess] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!newPassword || newPassword.trim().length < 4) {
      setModalError(
        language === "hi"
          ? "पासवर्ड कम से कम 4 अक्षरों का होना चाहिए"
          : "Password must be at least 4 characters long"
      );
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setModalError(t.passwordsDoNotMatch);
      return;
    }

    setIsSubmitting(true);
    let res: { success: boolean; error?: string };

    if (role === "teacher" && user) {
      res = await setTeacherPassword(user.id, newPassword);
    } else if (user) {
      res = await setAdminPassword(user.email, newPassword, user.name);
    } else {
      res = { success: false, error: "Not logged in" };
    }

    setIsSubmitting(false);

    if (res.success) {
      setModalSuccess(t.passwordSetSuccess);
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setNewPassword("");
        setConfirmPassword("");
        setModalSuccess("");
      }, 1200);
    } else {
      setModalError(res.error || "Failed to update password");
    }
  }

  const displayName = user
    ? user.name
    : language === "hi"
    ? "प्रशासक"
    : "Administrator";

  const welcomeText = user
    ? (language === "hi" ? `स्वागत है, ${user.name}` : `Welcome back, ${user.name}`)
    : t.welcomeAdmin;

  return (
    <>
      <header className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-muted">{welcomeText}</p>
          <h2 className="mt-1 text-xl font-bold text-foreground flex items-center gap-2">
            <span>{t.schoolOverview}</span>
            {user?.assignedClass && (
              <span className="rounded-full bg-light-green px-2.5 py-0.5 text-xs font-semibold text-primary">
                {user.assignedClass}
              </span>
            )}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Language Switcher Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === "en" ? "hi" : "en")}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-light-green px-3 py-1.5 text-xs font-bold text-primary hover:bg-emerald-200 transition cursor-pointer shadow-xs"
            title="Switch Language / भाषा बदलें"
          >
            <Globe size={15} />
            <span>{language === "en" ? "हिन्दी (HI)" : "English (EN)"}</span>
          </button>

          {/* Offline / Online Sync Indicator */}
          <SyncStatusBadge />

          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
            <Search size={18} className="text-muted" />
            <span className="text-sm text-muted">{t.searchPlaceholder}</span>
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="rounded-lg border border-border bg-surface p-2 text-muted hover:bg-light-green hover:text-primary transition-colors cursor-pointer"
          >
            <Bell size={20} />
          </button>

          {/* User Profile Badge & Quick Actions */}
          {user ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-1.5 pr-3 shadow-2xs">
              <UserCircle size={28} className="text-primary" />
              <div className="hidden text-left sm:block">
                <span className="block text-xs font-bold text-foreground leading-tight truncate max-w-[140px]">
                  {displayName}
                </span>
                <span className="block text-[10px] text-muted">
                  {role === "teacher"
                    ? (language === "hi" ? "शिक्षक" : "Teacher")
                    : (language === "hi" ? "प्रशासक" : "Administrator")}
                </span>
              </div>

              {/* Change Password Button */}
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                title={t.changePassword}
                className="ml-1 rounded-md p-1.5 text-muted hover:bg-light-green hover:text-primary transition cursor-pointer"
              >
                <KeyRound size={16} />
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                title={t.logout}
                className="rounded-md p-1.5 text-muted hover:bg-red-50 hover:text-danger transition cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition"
            >
              <UserCircle size={16} />
              <span>{t.loginButton}</span>
            </Link>
          )}
        </div>
      </header>

      {/* Change Password In-App Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <KeyRound size={18} className="text-primary" />
                <span>{t.changePassword}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-2.5 text-xs text-green-800">
                <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-green-600" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {t.newPassword}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      language === "hi"
                        ? "नया पासवर्ड या 4-अंकीय पिन"
                        : "New password or 4-digit PIN"
                    }
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-white pl-3 pr-9 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {t.confirmPassword}
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t.confirmPassword}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:bg-gray-100"
                >
                  {language === "hi" ? "रद्द करें" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {isSubmitting ? "..." : (language === "hi" ? "सहेजें" : "Save Password")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
