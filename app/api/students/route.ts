import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Student from "@/models/Student";
import Class from "@/models/Class";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    const query: any = {};
    if (classId && classId !== "all") {
      query.classId = classId;
    }

    const students = await Student.find(query).sort({ rollNumber: 1 });
    return NextResponse.json({ success: true, data: students });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const {
      name,
      rollNumber,
      classId,
      className,
      section,
      facePhotoUrl,
      faceEmbedding,
      guardianName,
      guardianPhone,
    } = body;

    if (!name || !rollNumber || !classId) {
      return NextResponse.json(
        { success: false, error: "Name, roll number, and class are required." },
        { status: 400 }
      );
    }

    // Check for duplicate roll number in same class
    const existing = await Student.findOne({ classId, rollNumber });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Roll number ${rollNumber} already exists in this class.`,
        },
        { status: 409 }
      );
    }

    const student = await Student.create({
      name,
      rollNumber,
      classId,
      className: className || "Class",
      section: section || "A",
      facePhotoUrl: facePhotoUrl || "",
      faceEmbedding: faceEmbedding || [],
      guardianName: guardianName || "",
      guardianPhone: guardianPhone || "",
      status: "active",
    });

    // Increment class student count
    await Class.findByIdAndUpdate(classId, { $inc: { studentCount: 1 } });

    return NextResponse.json({ success: true, data: student });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to enroll student" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Student ID required" }, { status: 400 });
    }

    const deleted = await Student.findByIdAndDelete(id);
    if (deleted) {
      await Class.findByIdAndUpdate(deleted.classId, { $inc: { studentCount: -1 } });
    }

    return NextResponse.json({ success: true, message: "Student deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete student" },
      { status: 500 }
    );
  }
}

