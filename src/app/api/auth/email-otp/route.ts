import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const body = await request.json();
  const { action, email, otp, password, name } = body;
  const selectedRole: "CUSTOMER" | "PROVIDER" = body.role ?? "CUSTOMER";

  // ─────────────────────────
  // SEND OTP
  // ─────────────────────────
  if (action === "send") {
    try {
       
       // ✅ STEP 1: check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered. Please sign in." },
        { status: 400 }
      );
    }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      await prisma.verification.create({
        data: {
          id: crypto.randomUUID(),
          identifier: email,
          value: generatedOtp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Your noorat OTP Code",
        html: `<p>Your OTP is <strong>${generatedOtp}</strong>. Expires in 10 minutes.</p>`,
      });

      console.log(`OTP sent to ${email}: ${generatedOtp}`);

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("Send OTP error:", err);
      return NextResponse.json(
        { error: "Failed to send OTP" },
        { status: 500 }
      );
    }
  }

  // ─────────────────────────
  // VERIFY OTP
  // ─────────────────────────
if (action === "verify") {
  try {

    const verification = await prisma.verification.findFirst({
      where: {
        identifier: email,
        value: otp,
      },
    });

    if (!verification || verification.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Delete OTP after successful check
    await prisma.verification.delete({
      where: { id: verification.id },
    });

    // Try to create user if doesn't exist yet
    try {
      await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
        },
      });
      // ^ If successful → user created with emailVerified = false
    } catch (err: any) {
      if (!err.message?.includes("already exists")) {
        throw err; // rethrow unexpected errors
      }
      console.log("User already exists, proceeding to verify & sign in");
    }

    // ─── Critical part ───
    // Mark email as verified in the user table
    await prisma.user.update({
      where: { email },
      data: {
          emailVerified: true,
          role: selectedRole,
      },
    });
    // ─────────────────────

    // Now sign in should succeed
    const session = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      asResponse: false,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 500 }
    );
  }
}

  return NextResponse.json(
    { error: "Invalid action" },
    { status: 400 }
  );
}