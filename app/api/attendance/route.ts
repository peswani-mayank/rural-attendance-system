import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Attendance from "@/models/Attendance";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const classId = searchParams.get("classId");

    const query: any = {};
    if (date) query.date = date;
    if (classId) query.classId = classId;

    const records = await Attendance.find(query).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

