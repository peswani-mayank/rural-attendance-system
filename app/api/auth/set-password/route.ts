import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword, validatePasswordStrength } from "@/lib/passwordUtils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, newPassword, role, name, phone, assignedClass } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email and new password are required" },
        { status: 400 }
      );
    }

    const val = validatePasswordStrength(newPassword, 4);
    if (!val.valid) {
      return NextResponse.json({ error: val.message }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const hashedPassword = await hashPassword(newPassword);

    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      user.password = hashedPassword;
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (role) user.role = role;
      await user.save();
    } else {
      user = await User.create({
        name: name || (role === "admin" ? "Administrator" : "Teacher"),
        email: normalizedEmail,
        password: hashedPassword,
        role: role || "teacher",
        phone: phone || "",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Password set successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
      },
    });
  } catch (err: any) {
    console.error("[API Set Password Error]", err);
    return NextResponse.json(
      { error: "Failed to update password on server" },
      { status: 500 }
    );
  }
}
