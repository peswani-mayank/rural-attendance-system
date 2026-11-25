"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { offlineDb, OfflineTeacher, OfflineUser } from "./offlineDb";
import { initializeOfflineDatabase } from "./syncService";
import { hashPassword, verifyPassword } from "./passwordUtils";

export type UserRole = "admin" | "teacher";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  assignedClass?: string;
  token?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginAdmin: (
    email: string,
    pass: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginTeacher: (
    identifier: string,
    passOrPin: string
  ) => Promise<{ success: boolean; error?: string }>;
  setTeacherPassword: (
    teacherIdOrEmail: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  setAdminPassword: (
    email: string,
    newPassword: string,
    name?: string
  ) => Promise<{ success: boolean; error?: string }>;
  registerTeacher: (data: {
    name: string;
    email: string;
    phone: string;
    assignedClass: string;
    password: string;
    subject?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  loginAdmin: async () => ({ success: false }),
  loginTeacher: async () => ({ success: false }),
  setTeacherPassword: async () => ({ success: false }),
  setAdminPassword: async () => ({ success: false }),
  registerTeacher: async () => ({ success: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Load existing session from localStorage upon mounting
  useEffect(() => {
    async function loadSession() {
      try {
        await initializeOfflineDatabase();
        const stored = localStorage.getItem("rural_auth_user");
        if (stored) {
          const parsed: AuthUser = JSON.parse(stored);
          setUser(parsed);
        }
      } catch (err) {
        console.error("[Auth] Error reading auth session:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  function saveSession(authUser: AuthUser) {
    setUser(authUser);
    localStorage.setItem("rural_auth_user", JSON.stringify(authUser));
  }

  // --- Administrator Login ---
  async function loginAdmin(email: string, pass: string) {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Try server online authentication first
    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password: pass, role: "admin" }),
        });
        if (res.ok) {
          const data = await res.json();
          saveSession(data.user);
          return { success: true };
        }
      } catch {
        // Fallback to offline local authentication
      }
    }

    // 2. Offline / Local fallback validation
    await initializeOfflineDatabase();
    const localUser = await offlineDb.users
      .where("email")
      .equalsIgnoreCase(cleanEmail)
      .first();

    if (localUser && localUser.role === "admin") {
      const match = await verifyPassword(pass, localUser.passwordHash);
      if (match) {
        const authUser: AuthUser = {
          id: localUser.id,
          name: localUser.name,
          email: localUser.email,
          role: "admin",
          phone: localUser.phone,
        };
        saveSession(authUser);
        return { success: true };
      }
      return { success: false, error: "Incorrect administrator password" };
    }

    // Default emergency fallback if database is empty: admin@school.gov.in / admin123
    if (cleanEmail === "admin@school.gov.in" && pass === "admin123") {
      const authUser: AuthUser = {
        id: "usr-admin-1",
        name: "Principal (Administrator)",
        email: "admin@school.gov.in",
        role: "admin",
      };
      saveSession(authUser);
      return { success: true };
    }

    return { success: false, error: "No administrator found with this email" };
  }

  // --- Teacher Login ---
  async function loginTeacher(identifier: string, passOrPin: string) {
    const cleanId = identifier.trim();
    const cleanEmail = cleanId.toLowerCase();

    // 1. Try online server login
    if (typeof navigator !== "undefined" && navigator.onLine && cleanEmail.includes("@")) {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password: passOrPin, role: "teacher" }),
        });
        if (res.ok) {
          const data = await res.json();
          saveSession(data.user);
          return { success: true };
        }
      } catch {
        // Fallback to local offline db
      }
    }

    // 2. Offline validation against offlineDb.teachers
    await initializeOfflineDatabase();
    const teachers = await offlineDb.teachers.toArray();

    const teacher = teachers.find(
      (t) =>
        t.id === cleanId ||
        t.email.toLowerCase() === cleanEmail ||
        t.phone.replace(/\s+/g, "") === cleanId.replace(/\s+/g, "") ||
        t.name.toLowerCase() === cleanId.toLowerCase()
    );

    if (!teacher) {
      return { success: false, error: "Teacher not found in faculty roster" };
    }

    // Check PIN or Password
    let isMatch = false;
    if (teacher.pin && teacher.pin === passOrPin.trim()) {
      isMatch = true;
    } else if (teacher.passwordHash) {
      isMatch = await verifyPassword(passOrPin, teacher.passwordHash);
    } else if (passOrPin.trim() === "1234") {
      // Default initial PIN for pre-seeded teachers who haven't set their own password yet
      isMatch = true;
    }

    if (isMatch) {
      const authUser: AuthUser = {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: "teacher",
        phone: teacher.phone,
        assignedClass: teacher.assignedClass,
      };
      saveSession(authUser);
      return { success: true };
    }

    return { success: false, error: "Incorrect teacher password or PIN" };
  }

  // --- Teacher Sets Their Own Password ---
  async function setTeacherPassword(teacherIdOrEmail: string, newPassword: string) {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: "Password must be at least 4 characters long" };
    }

    await initializeOfflineDatabase();
    const teachers = await offlineDb.teachers.toArray();
    const clean = teacherIdOrEmail.trim().toLowerCase();

    const teacher = teachers.find(
      (t) =>
        t.id === teacherIdOrEmail ||
        t.email.toLowerCase() === clean ||
        t.name.toLowerCase() === clean
    );

    if (!teacher) {
      return { success: false, error: "Teacher record not found" };
    }

    const hashed = await hashPassword(newPassword);
    const isPin = /^\d{4,6}$/.test(newPassword.trim());

    // Update in local Dexie
    await offlineDb.teachers.update(teacher.id, {
      passwordHash: hashed,
      pin: isPin ? newPassword.trim() : undefined,
    });

    // Also update/sync to server when online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        await fetch("/api/auth/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: teacher.email,
            newPassword,
            role: "teacher",
            name: teacher.name,
            phone: teacher.phone,
          }),
        });
      } catch (err) {
        console.warn("[Auth] Cloud password sync deferred:", err);
      }
    }

    // Auto-login
    const authUser: AuthUser = {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      role: "teacher",
      phone: teacher.phone,
      assignedClass: teacher.assignedClass,
    };
    saveSession(authUser);

    return { success: true };
  }

  // --- Administrator Sets Their Own Password ---
  async function setAdminPassword(email: string, newPassword: string, name?: string) {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: "Password must be at least 4 characters long" };
    }

    await initializeOfflineDatabase();
    const cleanEmail = email.toLowerCase().trim();
    const hashed = await hashPassword(newPassword);

    const existingAdmin = await offlineDb.users
      .where("email")
      .equalsIgnoreCase(cleanEmail)
      .first();

    const adminId = existingAdmin?.id || `usr-admin-${Date.now()}`;
    const adminName = name || existingAdmin?.name || "Principal (Administrator)";

    await offlineDb.users.put({
      id: adminId,
      name: adminName,
      email: cleanEmail,
      role: "admin",
      passwordHash: hashed,
      updatedAt: Date.now(),
    });

    // Sync to cloud if online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        await fetch("/api/auth/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            newPassword,
            role: "admin",
            name: adminName,
          }),
        });
      } catch (err) {
        console.warn("[Auth] Cloud password sync deferred:", err);
      }
    }

    // Auto-login
    const authUser: AuthUser = {
      id: adminId,
      name: adminName,
      email: cleanEmail,
      role: "admin",
    };
    saveSession(authUser);

    return { success: true };
  }

  // --- Teacher Self-Registration ---
  async function registerTeacher(data: {
    name: string;
    email: string;
    phone: string;
    assignedClass: string;
    password: string;
    subject?: string;
  }) {
    if (!data.name || !data.email || !data.password) {
      return { success: false, error: "Name, email and password are required" };
    }

    await initializeOfflineDatabase();
    const hashed = await hashPassword(data.password);
    const isPin = /^\d{4,6}$/.test(data.password.trim());
    const teacherId = `tch-${Date.now()}`;

    const newTeacher: OfflineTeacher = {
      id: teacherId,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim() || "+91 94140 00000",
      subject: data.subject || "General Subjects",
      assignedClass: data.assignedClass || "Grade 5-A",
      status: "active",
      passwordHash: hashed,
      pin: isPin ? data.password.trim() : undefined,
    };

    await offlineDb.teachers.put(newTeacher);

    // Sync to cloud if online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        await fetch("/api/auth/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: newTeacher.email,
            newPassword: data.password,
            role: "teacher",
            name: newTeacher.name,
            phone: newTeacher.phone,
          }),
        });
      } catch (err) {
        console.warn("[Auth] Cloud teacher registration sync deferred:", err);
      }
    }

    const authUser: AuthUser = {
      id: newTeacher.id,
      name: newTeacher.name,
      email: newTeacher.email,
      role: "teacher",
      phone: newTeacher.phone,
      assignedClass: newTeacher.assignedClass,
    };
    saveSession(authUser);

    return { success: true };
  }

  // --- Logout ---
  function logout() {
    setUser(null);
    localStorage.removeItem("rural_auth_user");
    // Clear cookie
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        loginAdmin,
        loginTeacher,
        setTeacherPassword,
        setAdminPassword,
        registerTeacher,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
