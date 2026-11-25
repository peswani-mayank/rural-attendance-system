import Dexie, { type EntityTable } from "dexie";

export interface OfflineStudent {
  id: string;
  name: string;
  rollNumber: string;
  classId: string;
  section: string;
  faceEmbedding?: number[];
  facePhotoUrl?: string;
  guardianName?: string;
  guardianPhone?: string;
}

export interface OfflineClass {
  id: string;
  name: string;
  grade: string;
  section: string;
  studentCount?: number;
}

export interface OfflineTeacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  assignedClass: string;
  status: "active" | "on-leave";
  passwordHash?: string;
  pin?: string;
}

export interface OfflineUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "teacher";
  passwordHash: string;
  phone?: string;
  assignedClass?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface AttendanceStudentItem {
  studentId: string;
  studentName: string;
  rollNumber: string;
  photoUrl?: string;
  status: "present" | "absent" | "late";
  confidence?: number;
  faceBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  verified: boolean;
}

export interface OfflineAttendanceRecord {
  id?: number;
  sessionId: string;
  classId: string;
  className: string;
  section: string;
  date: string;
  photoDataUrl?: string;
  records: AttendanceStudentItem[];
  totalPresent: number;
  totalAbsent: number;
  takenBy: string;
  synced: boolean;
  createdAt: number;
  syncedAt?: number;
}

// Initialize Dexie Offline Database
export class RuralOfflineDatabase extends Dexie {
  students!: EntityTable<OfflineStudent, "id">;
  classes!: EntityTable<OfflineClass, "id">;
  teachers!: EntityTable<OfflineTeacher, "id">;
  attendanceQueue!: EntityTable<OfflineAttendanceRecord, "id">;
  users!: EntityTable<OfflineUser, "id">;

  constructor() {
    super("RuralAttendanceDB");
    this.version(1).stores({
      students: "id, classId, rollNumber, name",
      classes: "id, name, grade",
      attendanceQueue: "++id, sessionId, classId, date, synced, createdAt",
    });
    this.version(2).stores({
      teachers: "id, name, assignedClass",
    });
    this.version(3).stores({
      teachers: "id, email, name, assignedClass",
      users: "id, email, role",
    });
  }
}

export const offlineDb = new RuralOfflineDatabase();
