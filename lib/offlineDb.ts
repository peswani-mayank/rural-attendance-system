import Dexie, { type EntityTable } from "dexie";

export interface OfflineStudent {
  id: string;
  name: string;
  rollNumber: string;
  classId: string;
  section: string;
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

export interface AttendanceStudentItem {
  studentId: string;
  studentName: string;
  rollNumber: string;
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
  attendanceQueue!: EntityTable<OfflineAttendanceRecord, "id">;

  constructor() {
    super("RuralAttendanceDB");
    this.version(1).stores({
      students: "id, classId, rollNumber, name",
      classes: "id, name, grade",
      attendanceQueue: "++id, sessionId, classId, date, synced, createdAt",
    });
  }
}

export const offlineDb = new RuralOfflineDatabase();

