"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import {
  Settings,
  School,
  Sparkles,
  Wifi,
  Trash2,
  Save,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { offlineDb } from "@/lib/offlineDb";
import { useAuth } from "@/lib/authContext";
import { useLanguage } from "@/lib/languageContext";

export default function SettingsPage() {
  const { user, role, setAdminPassword, setTeacherPassword } = useAuth();
  const { language, t } = useLanguage();

  const [schoolName, setSchoolName] = useState("Government Upper Primary School, Rampura");
  const [udiseCode, setUdiseCode] = useState("08120401201");
  const [district, setDistrict] = useState("Jaipur");
  const [state, setState] = useState("Rajasthan");
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState("80");
  const [savedNotice, setSavedNotice] = useState(false);

  // Security Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setPasswordNotice("");
    setPasswordError("");

    if (!newPassword || newPassword.trim().length < 4) {
      setPasswordError(
        language === "hi"
          ? "पासवर्ड कम से कम 4 अक्षरों का होना चाहिए"
          : "Password must be at least 4 characters long"
      );
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordError(t.passwordsDoNotMatch);
      return;
    }

    let res: { success: boolean; error?: string };
    if (role === "teacher" && user) {
      res = await setTeacherPassword(user.id, newPassword);
    } else {
      res = await setAdminPassword(user?.email || "admin@school.gov.in", newPassword, user?.name);
    }

    if (res.success) {
      setPasswordNotice(t.passwordSetSuccess);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordNotice(""), 3500);
    } else {
      setPasswordError(res.error || "Failed to update password");
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  }

  async function handleClearOfflineCache() {
    if (confirm("Are you sure you want to clear the offline sync queue? Unsynced records will be removed.")) {
      await offlineDb.attendanceQueue.clear();
      alert("Offline queue cleared successfully.");
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="min-w-0 flex-1 p-6 md:p-8">
        <DashboardHeader />

        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings className="text-primary" size={26} />
              System Settings & Configuration
            </h1>
            <p className="mt-1 text-sm text-muted">
              Configure school identity, AI face-matching thresholds, and offline storage parameters.
            </p>
          </div>

          {savedNotice && (
            <div className="flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800">
              <CheckCircle2 size={15} />
              <span>Settings saved!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
          {/* School Identity */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
              <School className="text-primary" size={18} />
              School Information & Location
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  School Name
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  UDISE+ School Code
                </label>
                <input
                  type="text"
                  value={udiseCode}
                  onChange={(e) => setUdiseCode(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  District & State
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
              <Sparkles className="text-primary" size={18} />
              AI Face Recognition Tuning
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Minimum Confidence Match Threshold ({aiConfidenceThreshold}%)
                </label>
                <input
                  type="range"
                  min="60"
                  max="95"
                  value={aiConfidenceThreshold}
                  onChange={(e) => setAiConfidenceThreshold(e.target.value)}
                  className="w-full accent-primary cursor-pointer"
                />
                <p className="text-[11px] text-muted mt-1">
                  Lower threshold catches more faces in dim rural classrooms; higher threshold reduces false positives.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Teacher In-the-Loop Mandate
                </label>
                <div className="flex items-center h-10 px-3 rounded-lg bg-light-green/60 text-xs font-semibold text-primary">
                  Strictly Enabled (AI recommends, Teacher verifies)
                </div>
              </div>
            </div>
          </div>

          {/* Account Security & Password Management */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
              <KeyRound className="text-primary" size={18} />
              {language === "hi" ? "खाता सुरक्षा एवं पासवर्ड प्रबंधन" : "Account Security & Password Management"}
            </h2>

            {user && (
              <div className="mb-4 rounded-lg bg-light-green/50 p-3 text-xs flex flex-wrap items-center justify-between gap-2 border border-primary/20">
                <div>
                  <span className="text-muted block">{language === "hi" ? "लॉग इन खाता" : "Current Session"}</span>
                  <span className="font-bold text-foreground text-sm">{user.name} ({user.email})</span>
                </div>
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
                  {role === "admin" ? (language === "hi" ? "प्रशासक" : "Administrator") : (language === "hi" ? "शिक्षक" : "Teacher")}
                </span>
              </div>
            )}

            {passwordNotice && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                <span>{passwordNotice}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <AlertCircle size={16} className="text-red-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {t.newPassword}
                </label>
                <input
                  type="password"
                  placeholder={language === "hi" ? "नया पासवर्ड या 4-अंकीय पिन" : "New password or 4-digit PIN"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {t.confirmPassword}
                </label>
                <input
                  type="password"
                  placeholder={t.confirmPassword}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={handlePasswordUpdate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition cursor-pointer"
              >
                <KeyRound size={14} />
                <span>{language === "hi" ? "नया पासवर्ड सहेजें" : "Update Password"}</span>
              </button>
            </div>
          </div>

          {/* Offline Storage & Maintenance */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
              <Wifi className="text-primary" size={18} />
              Offline PWA & Local Database Storage
            </h2>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  IndexedDB Local Cache
                </h4>
                <p className="text-xs text-muted mt-0.5">
                  Stores offline attendance sessions, classroom rosters, and pending sync batches.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClearOfflineCache}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Clear Local Cache</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 transition shadow-xs cursor-pointer"
            >
              <Save size={16} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

