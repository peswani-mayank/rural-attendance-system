import mongoose, { Schema, Model, Document } from "mongoose";

export interface IStudent extends Document {
  name: string;
  rollNumber: string;
  classId: mongoose.Types.ObjectId;
  className: string;
  section: string;
  facePhotoUrl?: string;
  faceEmbedding?: number[];
  guardianName?: string;
  guardianPhone?: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    name: { type: String, required: true },
    rollNumber: { type: String, required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    className: { type: String, required: true },
    section: { type: String, required: true, default: "A" },
    facePhotoUrl: { type: String },
    faceEmbedding: { type: [Number], default: [] },
    guardianName: { type: String },
    guardianPhone: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

StudentSchema.index({ classId: 1, rollNumber: 1 }, { unique: true });

export const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);

export default Student;

