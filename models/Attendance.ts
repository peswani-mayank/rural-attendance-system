import mongoose, { Schema, Model, Document } from "mongoose";

export interface IAttendanceItem {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  rollNumber: string;
  status: "present" | "absent" | "late";
  confidence?: number;
  verified: boolean;
}

export interface IAttendance extends Document {
  sessionId: string;
  classId: mongoose.Types.ObjectId;
  className: string;
  section: string;
  date: string; // YYYY-MM-DD
  photoUrl?: string;
  records: IAttendanceItem[];
  totalPresent: number;
  totalAbsent: number;
  takenBy: string; // Teacher name or id
  syncStatus: "synced" | "pending";
  syncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceItemSchema = new Schema<IAttendanceItem>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    status: { type: String, enum: ["present", "absent", "late"], required: true },
    confidence: { type: Number, min: 0, max: 1 },
    verified: { type: Boolean, default: true },
  },
  { _id: false }
);

const AttendanceSchema = new Schema<IAttendance>(
  {
    sessionId: { type: String, required: true, unique: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    className: { type: String, required: true },
    section: { type: String, required: true },
    date: { type: String, required: true },
    photoUrl: { type: String },
    records: [AttendanceItemSchema],
    totalPresent: { type: Number, default: 0 },
    totalAbsent: { type: Number, default: 0 },
    takenBy: { type: String, required: true },
    syncStatus: { type: String, enum: ["synced", "pending"], default: "synced" },
    syncedAt: { type: Date },
  },
  { timestamps: true }
);

AttendanceSchema.index({ classId: 1, date: 1 });

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;

