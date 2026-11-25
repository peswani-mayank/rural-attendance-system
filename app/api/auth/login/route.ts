import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/passwordUtils";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "rural-attendance-system-secure-jwt-key-2026"
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const query: Record<string, any> = { email: normalizedEmail };
    if (role) {
      query.role = role;
    }

    const user = await User.findOne(query);

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials or user not found" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Sign JWT
    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        assignedClass: user.assignedClasses?.[0]?.toString() || "",
      },
      token,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("[API Auth Login Error]", err);
    return NextResponse.json(
      { error: "Server authentication error or database offline" },
      { status: 500 }
    );
  }
}
