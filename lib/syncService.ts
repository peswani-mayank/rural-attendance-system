import {
  offlineDb,
  OfflineAttendanceRecord,
  OfflineClass,
  OfflineStudent,
  OfflineTeacher,
} from "./offlineDb";

export const INITIAL_DEMO_TEACHERS: OfflineTeacher[] = [
  {
    id: "tch-1",
    name: "Sunita Deshmukh",
    email: "sunita.d@school.gov.in",
    phone: "+91 94140 12345",
    subject: "Mathematics & Science",
    assignedClass: "Grade 5-A",
    status: "active",
    passwordHash: "$2b$08$TpugIiJQBK4ZGpwaM02//u0zLpDqzM2iSAvbEfMBoQ6pGWnumg4oG",
    pin: "1234",
  },
  {
    id: "tch-2",
    name: "Rajendra Prasad",
    email: "rajendra.p@school.gov.in",
    phone: "+91 94140 23456",
    subject: "Social Studies & Hindi",
    assignedClass: "Grade 6-A",
    status: "active",
    passwordHash: "$2b$08$TpugIiJQBK4ZGpwaM02//u0zLpDqzM2iSAvbEfMBoQ6pGWnumg4oG",
    pin: "1234",
  },
  {
    id: "tch-3",
    name: "Kavita Nair",
    email: "kavita.n@school.gov.in",
    phone: "+91 94140 34567",
    subject: "English & Environmental Studies",
    assignedClass: "Grade 7-B",
    status: "active",
    passwordHash: "$2b$08$TpugIiJQBK4ZGpwaM02//u0zLpDqzM2iSAvbEfMBoQ6pGWnumg4oG",
    pin: "1234",
  },
];

export const INITIAL_DEMO_CLASSES: OfflineClass[] = [
  { id: "cls-1", name: "Grade 5-A", grade: "5", section: "A", studentCount: 12 },
  { id: "cls-2", name: "Grade 6-A", grade: "6", section: "A", studentCount: 0 },
  { id: "cls-3", name: "Grade 7-B", grade: "7", section: "B", studentCount: 0 },
];

export const INITIAL_DEMO_STUDENTS: OfflineStudent[] = [
  { id: "stu-101", name: "Aarav Sharma", rollNumber: "501", classId: "cls-1", section: "A", guardianName: "Rajesh Sharma", guardianPhone: "+91 98765 43210" },
  { id: "stu-102", name: "Priya Patel", rollNumber: "502", classId: "cls-1", section: "A", guardianName: "Suresh Patel", guardianPhone: "+91 98765 43211" },
  { id: "stu-103", name: "Rohan Verma", rollNumber: "503", classId: "cls-1", section: "A", guardianName: "Vikram Verma", guardianPhone: "+91 98765 43212" },
  { id: "stu-104", name: "Ananya Singh", rollNumber: "504", classId: "cls-1", section: "A", guardianName: "Manoj Singh", guardianPhone: "+91 98765 43213" },
  { id: "stu-105", name: "Devendra Kumar", rollNumber: "505", classId: "cls-1", section: "A", guardianName: "Kailash Kumar", guardianPhone: "+91 98765 43214" },
  { id: "stu-106", name: "Meera Bai", rollNumber: "506", classId: "cls-1", section: "A", guardianName: "Ramesh Bai", guardianPhone: "+91 98765 43215" },
  { id: "stu-107", name: "Vikram Rathore", rollNumber: "507", classId: "cls-1", section: "A", guardianName: "Mahendra Rathore", guardianPhone: "+91 98765 43216" },
  { id: "stu-108", name: "Kavita Devi", rollNumber: "508", classId: "cls-1", section: "A", guardianName: "Dinesh Devi", guardianPhone: "+91 98765 43217" },
  { id: "stu-109", name: "Aditya Joshi", rollNumber: "509", classId: "cls-1", section: "A", guardianName: "Sunil Joshi", guardianPhone: "+91 98765 43218" },
  { id: "stu-110", name: "Sneha Gupta", rollNumber: "510", classId: "cls-1", section: "A", guardianName: "Ajay Gupta", guardianPhone: "+91 98765 43219" },
  { id: "stu-111", name: "Manish Meena", rollNumber: "511", classId: "cls-1", section: "A", guardianName: "Ramswaroop Meena", guardianPhone: "+91 98765 43220" },
  { id: "stu-112", name: "Pooja Gurjar", rollNumber: "512", classId: "cls-1", section: "A", guardianName: "Gopal Gurjar", guardianPhone: "+91 98765 43221" },
];

/**
 * Initializes offline local database with foundational rural school data
 * if no cached records currently exist in IndexedDB.
 */
export async function initializeOfflineDatabase() {
  if (typeof window === "undefined") return;

  try {
    const classCount = await offlineDb.classes.count();
    if (classCount === 0) {
      await offlineDb.classes.bulkPut(INITIAL_DEMO_CLASSES);
      await offlineDb.students.bulkPut(INITIAL_DEMO_STUDENTS);
      await offlineDb.teachers.bulkPut(INITIAL_DEMO_TEACHERS);
      console.log("[OfflineDB] Seeded initial classes, students, and teachers successfully.");
    } else {
      const teacherCount = await offlineDb.teachers.count();
      if (teacherCount === 0) {
        await offlineDb.teachers.bulkPut(INITIAL_DEMO_TEACHERS);
      }
    }

    // Seed default admin account if not already initialized
    const userCount = await offlineDb.users.count();
    if (userCount === 0) {
      await offlineDb.users.put({
        id: "usr-admin-1",
        name: "Principal (Administrator)",
        email: "admin@school.gov.in",
        role: "admin",
        passwordHash: "$2b$08$dddPFNoqCnPy84wIMy9w5.jlsNW0zeBE3VxpAxPRcyUfambOu/5Gm",
        phone: "+91 94140 99999",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log("[OfflineDB] Seeded initial administrator account.");
    }
  } catch (error) {
    console.error("[OfflineDB] Failed to initialize offline cache:", error);
  }
}

/**
 * Synchronizes pending offline attendance records with the central database.
 */
export async function syncPendingAttendance(): Promise<{
  success: boolean;
  syncedCount: number;
  message: string;
}> {
  if (typeof window === "undefined") {
    return { success: false, syncedCount: 0, message: "Window not available" };
  }

  if (!navigator.onLine) {
    return {
      success: false,
      syncedCount: 0,
      message: "Device is currently offline. Will retry when connection returns.",
    };
  }

  try {
    // Find all un-synced attendance sessions
    const pendingSessions = await offlineDb.attendanceQueue
      .filter((session) => !session.synced)
      .toArray();

    if (pendingSessions.length === 0) {
      return { success: true, syncedCount: 0, message: "All records are already up-to-date." };
    }

    const response = await fetch("/api/attendance/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessions: pendingSessions }),
    });

    if (!response.ok) {
      // If server is not reachable or database is offline, leave queued
      return {
        success: false,
        syncedCount: 0,
        message: `Sync failed with status: ${response.status}`,
      };
    }

    const data = await response.json();

    // Mark successfully synced records in IndexedDB
    for (const session of pendingSessions) {
      if (session.id) {
        await offlineDb.attendanceQueue.update(session.id, {
          synced: true,
          syncedAt: Date.now(),
        });
      }
    }

    return {
      success: true,
      syncedCount: pendingSessions.length,
      message: `Successfully synchronized ${pendingSessions.length} attendance session(s) to central database!`,
    };
  } catch (error) {
    console.warn("[SyncService] Sync attempt encountered network or server error:", error);
    return {
      success: false,
      syncedCount: 0,
      message: "Could not reach server. Data is stored safely on device and will sync later.",
    };
  }
}

