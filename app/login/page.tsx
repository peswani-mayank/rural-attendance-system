"use client";

import Link from "next/link";
import { School, GraduationCap, ShieldCheck, Globe, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/languageContext";

export default function LoginPage() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-light-green selection:text-primary">
      {/* Top Bar with Language Switcher */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
            <School size={22} />
          </div>
          <div>
            <h1 className="text-base font-bold text-primary">RuralAttend</h1>
            <p className="text-[11px] text-muted">
              {language === "hi"
                ? "ग्रामीण विद्यालय उपस्थिति प्रणाली"
                : "Rural School Attendance System"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLanguage(language === "en" ? "hi" : "en")}
          className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-light-green px-3 py-1.5 text-xs font-bold text-primary hover:bg-emerald-200 transition cursor-pointer shadow-xs"
          title="Switch Language / भाषा बदलें"
        >
          <Globe size={14} />
          <span>{language === "en" ? "हिन्दी (HI)" : "English (EN)"}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-4xl">
          {/* Header Title */}
          <div className="mb-10 text-center">
            <span className="inline-flex items-center rounded-full bg-light-green px-3 py-1 text-xs font-semibold text-primary">
              {language === "hi" ? "ऑफ़लाइन-सक्षम AI पोर्टल" : "Offline-First AI Attendance"}
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {t.loginPortal}
            </h2>
            <p className="mt-2 text-sm text-muted max-w-md mx-auto">
              {t.selectRole}
            </p>
          </div>

          {/* Dual Role Selector Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Teacher Card */}
            <div className="group relative flex flex-col justify-between rounded-2xl border-2 border-border bg-surface p-7 shadow-xs hover:border-primary hover:shadow-md transition-all">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-light-green text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <GraduationCap size={28} />
                </div>
                <h3 className="mt-5 text-xl font-bold text-foreground">
                  {t.teacherPortal}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {t.teacherPortalDesc}
                </p>

                <ul className="mt-4 space-y-1.5 text-xs text-muted">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {language === "hi" ? "कक्षा अनुसार त्वरित उपस्थिति" : "Quick class-wise camera attendance"}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {language === "hi" ? "शिक्षक द्वारा अपना पासवर्ड/पिन स्वयं तय करना" : "Set & manage your own password / PIN"}
                  </li>
                </ul>
              </div>

              <div className="mt-8 space-y-2.5">
                <Link
                  href="/login/teacher"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  <span>{t.loginAsTeacher}</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/login/teacher/set-password"
                  className="block text-center text-xs font-semibold text-primary hover:underline"
                >
                  {t.firstTimeTeacher}
                </Link>
              </div>
            </div>

            {/* Administrator Card */}
            <div className="group relative flex flex-col justify-between rounded-2xl border-2 border-border bg-surface p-7 shadow-xs hover:border-emerald-700 hover:shadow-md transition-all">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="mt-5 text-xl font-bold text-foreground">
                  {t.adminPortal}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {t.adminPortalDesc}
                </p>

                <ul className="mt-4 space-y-1.5 text-xs text-muted">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
                    {language === "hi" ? "छात्र चेहरे नामांकन एवं बायोमेट्रिक्स" : "Student biometric photo enrollment"}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
                    {language === "hi" ? "शिक्षक व कक्षा प्रबंधन" : "Faculty & class management"}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
                    {language === "hi" ? "उपस्थिति रिपोर्ट्स एवं ऑफ़लाइन सिंक इतिहास" : "Official attendance reports & sync history"}
                  </li>
                </ul>
              </div>

              <div className="mt-8 space-y-2.5">
                <Link
                  href="/login/admin"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900 transition-colors shadow-xs"
                >
                  <span>{t.loginAsAdmin}</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/login/admin/setup"
                  className="block text-center text-xs font-semibold text-emerald-800 hover:underline"
                >
                  {t.firstTimeAdmin}
                </Link>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-10 text-center text-xs text-muted">
            <p>
              {language === "hi"
                ? "यह प्रणाली इंटरनेट न होने पर भी 100% ऑफ़लाइन कार्य करती है।"
                : "Designed for rural schools. Works completely offline with cached local credentials."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
