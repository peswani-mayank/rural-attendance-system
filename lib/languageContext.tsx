"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Language = "en" | "hi";

export interface Translations {
  // Navigation
  dashboard: string;
  students: string;
  teachers: string;
  classes: string;
  attendance: string;
  reports: string;
  settings: string;
  logout: string;
  mainMenu: string;

  // Header & Status
  welcomeAdmin: string;
  schoolOverview: string;
  online: string;
  offlineMode: string;
  pendingSync: string;
  allSynced: string;
  searchPlaceholder: string;

  // Dashboard Stats
  totalStudents: string;
  presentToday: string;
  absentToday: string;
  totalTeachers: string;
  enrolledInSchool: string;
  verifiedByAI: string;
  notInClassroom: string;
  activeFaculty: string;
  weeklyAttendance: string;
  recentAttendance: string;
  markWithAI: string;

  // Attendance Capture
  takeAttendance: string;
  classroomSnapshot: string;
  openCamera: string;
  captureSnapshot: string;
  uploadPhoto: string;
  teacherVerification: string;
  confirmAttendance: string;
  present: string;
  absent: string;
  late: string;
  faceMatch: string;
  unknownFace: string;

  // Auth & Login
  loginPortal: string;
  selectRole: string;
  teacherPortal: string;
  teacherPortalDesc: string;
  adminPortal: string;
  adminPortalDesc: string;
  loginAsTeacher: string;
  loginAsAdmin: string;
  emailOrPhone: string;
  passwordOrPin: string;
  loginButton: string;
  firstTimeTeacher: string;
  firstTimeAdmin: string;
  setYourPassword: string;
  newPassword: string;
  confirmPassword: string;
  saveAndLogin: string;
  registerNewTeacher: string;
  registerButton: string;
  passwordsDoNotMatch: string;
  passwordSetSuccess: string;
  fullName: string;
  assignedClass: string;
  selectTeacher: string;
  forgotPassword: string;
  backToLogin: string;
  changePassword: string;
  currentPassword: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    students: "Students",
    teachers: "Teachers",
    classes: "Classes",
    attendance: "Attendance",
    reports: "Reports",
    settings: "Settings",
    logout: "Logout",
    mainMenu: "Main Menu",

    // Header & Status
    welcomeAdmin: "Welcome back, Administrator",
    schoolOverview: "School Overview",
    online: "Online",
    offlineMode: "Offline Mode",
    pendingSync: "Pending Sync",
    allSynced: "All Synced",
    searchPlaceholder: "Search...",

    // Dashboard Stats
    totalStudents: "Total Students",
    presentToday: "Present Today",
    absentToday: "Absent Today",
    totalTeachers: "Total Teachers",
    enrolledInSchool: "Enrolled in school database",
    verifiedByAI: "Verified via AI attendance",
    notInClassroom: "Students not in classroom image",
    activeFaculty: "Active faculty members",
    weeklyAttendance: "Weekly Attendance",
    recentAttendance: "Recent Attendance",
    markWithAI: "Mark with AI",

    // Attendance Capture
    takeAttendance: "Take Attendance",
    classroomSnapshot: "Classroom Snapshot",
    openCamera: "Open Camera",
    captureSnapshot: "Capture Snapshot",
    uploadPhoto: "Upload Photo",
    teacherVerification: "Teacher Verification Roster",
    confirmAttendance: "Confirm & Record Attendance",
    present: "Present",
    absent: "Absent",
    late: "Late",
    faceMatch: "Face Match",
    unknownFace: "Unknown / Unenrolled",

    // Auth & Login
    loginPortal: "RuralAttend School Portal",
    selectRole: "Choose your role to access the attendance system",
    teacherPortal: "Teacher Portal",
    teacherPortalDesc: "Take classroom attendance & check daily student rolls",
    adminPortal: "Administrator Portal",
    adminPortalDesc: "Complete school oversight, faculty administration & official registers",
    loginAsTeacher: "Login as Teacher",
    loginAsAdmin: "Login as Administrator",
    emailOrPhone: "Email, Phone or Name",
    passwordOrPin: "Password or 4-Digit PIN",
    loginButton: "Sign In",
    firstTimeTeacher: "First time here? Set your password",
    firstTimeAdmin: "First time setup? Set admin password",
    setYourPassword: "Set Your Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    saveAndLogin: "Save Password & Enter",
    registerNewTeacher: "New Faculty? Register Here",
    registerButton: "Register & Set Password",
    passwordsDoNotMatch: "Passwords do not match",
    passwordSetSuccess: "Password saved successfully!",
    fullName: "Full Name",
    assignedClass: "Assigned Class",
    selectTeacher: "Select Teacher from School Roster",
    forgotPassword: "Forgot Password?",
    backToLogin: "Back to Login",
    changePassword: "Change Password",
    currentPassword: "Current Password",
  },
  hi: {
    // Navigation
    dashboard: "डैशबोर्ड",
    students: "छात्र पंजीयन",
    teachers: "शिक्षक गण",
    classes: "कक्षाएं",
    attendance: "उपस्थिति",
    reports: "रिपोर्ट्स",
    settings: "सेटिंग्स",
    logout: "लॉगआउट",
    mainMenu: "मुख्य मेनू",

    // Header & Status
    welcomeAdmin: "स्वागत है, प्रधानाध्यापक महोदय",
    schoolOverview: "विद्यालय अवलोकन",
    online: "ऑनलाइन",
    offlineMode: "ऑफ़लाइन मोड",
    pendingSync: "सिंक लंबित",
    allSynced: "सभी सिंक पूर्ण",
    searchPlaceholder: "खोजें...",

    // Dashboard Stats
    totalStudents: "कुल नामांकित छात्र",
    presentToday: "आज उपस्थित छात्र",
    absentToday: "आज अनुपस्थित छात्र",
    totalTeachers: "कुल शिक्षक",
    enrolledInSchool: "विद्यालय डेटाबेस में नामांकित",
    verifiedByAI: "एआई द्वारा सत्यापित",
    notInClassroom: "कक्षा में अनुपस्थित छात्र",
    activeFaculty: "कार्यरत शिक्षक",
    weeklyAttendance: "साप्ताहिक उपस्थिति",
    recentAttendance: "हालिया उपस्थिति सत्र",
    markWithAI: "एआई से उपस्थिति लें",

    // Attendance Capture
    takeAttendance: "उपस्थिति दर्ज करें",
    classroomSnapshot: "कक्षा की तस्वीर",
    openCamera: "कैमरा खोलें",
    captureSnapshot: "तस्वीर खींचें",
    uploadPhoto: "फोटो अपलोड करें",
    teacherVerification: "शिक्षक सत्यापन सूची",
    confirmAttendance: "उपस्थिति दर्ज एवं सुरक्षित करें",
    present: "उपस्थित",
    absent: "अनुपस्थित",
    late: "विलंब",
    faceMatch: "चेहरा मिलान",
    unknownFace: "अपरिचित / अनामांकित",

    // Auth & Login
    loginPortal: "रूरलअटेंड विद्यालय पोर्टल",
    selectRole: "उपस्थिति प्रणाली का उपयोग करने के लिए अपनी भूमिका चुनें",
    teacherPortal: "शिक्षक पोर्टल",
    teacherPortalDesc: "कक्षा उपस्थिति लें और दैनिक छात्र सूची देखें",
    adminPortal: "प्रशासक पोर्टल",
    adminPortalDesc: "सम्पूर्ण विद्यालय प्रबंधन, शिक्षक प्रशासन और आधिकारिक रजिस्टर",
    loginAsTeacher: "शिक्षक के रूप में प्रवेश करें",
    loginAsAdmin: "प्रशासक के रूप में प्रवेश करें",
    emailOrPhone: "ईमेल, फोन नंबर या नाम",
    passwordOrPin: "पासवर्ड या 4-अंकीय पिन",
    loginButton: "लॉग इन करें",
    firstTimeTeacher: "पहली बार आए हैं? अपना पासवर्ड सेट करें",
    firstTimeAdmin: "प्रारंभिक सेटअप? व्यवस्थापक पासवर्ड सेट करें",
    setYourPassword: "अपना पासवर्ड सेट करें",
    newPassword: "नया पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    saveAndLogin: "पासवर्ड सुरक्षित करें और प्रवेश करें",
    registerNewTeacher: "नए शिक्षक? यहाँ पंजीकरण करें",
    registerButton: "पंजीकरण करें एवं पासवर्ड बनाएं",
    passwordsDoNotMatch: "दोनों पासवर्ड मेल नहीं खाते",
    passwordSetSuccess: "पासवर्ड सफलतापूर्वक सुरक्षित हो गया!",
    fullName: "पूरा नाम",
    assignedClass: "आवंटित कक्षा",
    selectTeacher: "विद्यालय सूची से शिक्षक चुनें",
    forgotPassword: "पासवर्ड भूल गए?",
    backToLogin: "लॉगिन पृष्ठ पर वापस जाएं",
    changePassword: "पासवर्ड बदलें",
    currentPassword: "वर्तमान पासवर्ड",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("rural_attend_lang") as Language;
    if (saved === "en" || saved === "hi") {
      setLanguageState(saved);
    }
  }, []);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    localStorage.setItem("rural_attend_lang", lang);
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

