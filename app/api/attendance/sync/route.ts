import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Attendance from "@/models/Attendance";
import Class from "@/models/Class";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessions } = body;

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No sessions to sync." });
    }

    try {
      await connectToDatabase();
    } catch (dbError) {
      console.warn("[Sync API] Central database connection unavailable:", dbError);
      return NextResponse.json(
        { error: "Central database unavailable. Offline records retained in device queue." },
        { status: 503 }
      );
    }

    let syncedCount = 0;

    for (const session of sessions) {
      // Upsert by sessionId to prevent duplicate records
      await Attendance.findOneAndUpdate(
        { sessionId: session.sessionId },
        {
          sessionId: session.sessionId,
          classId: session.classId,
          className: session.className,
          section: session.section,
          date: session.date,
          photoUrl: session.photoDataUrl || "",
          records: session.records.map((r: any) => ({
            studentId: r.studentId,
            studentName: r.studentName,
            rollNumber: r.rollNumber,
            photoUrl: r.photoUrl || "",
            status: r.status,
            confidence: r.confidence || 0,
            verified: r.verified !== false,
          })),
          totalPresent: session.totalPresent,
          totalAbsent: session.totalAbsent,
          takenBy: session.takenBy || "Teacher",
          syncStatus: "synced",
          syncedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      syncedCount++;
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      message: `Successfully synchronized ${syncedCount} session(s).`,
    });
  } catch (error: any) {
    console.error("[Sync API] Error processing sync:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync attendance sessions" },
      { status: 500 }
    );
  }
}

