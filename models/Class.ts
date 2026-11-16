import mongoose, { Schema, Model, Document } from "mongoose";

export interface IClass extends Document {
  name: string;
  grade: string;
  section: string;
  academicYear: string;
  teacherId?: mongoose.Types.ObjectId;
  teacherName?: string;
  studentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    name: { type: String, required: true },
    grade: { type: String, required: true },
    section: { type: String, required: true, default: "A" },
    academicYear: { type: String, default: "2026-2027" },
    teacherId: { type: Schema.Types.ObjectId, ref: "User" },
    teacherName: { type: String },
    studentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Class: Model<IClass> =
  mongoose.models.Class || mongoose.model<IClass>("Class", ClassSchema);

export default Class;

