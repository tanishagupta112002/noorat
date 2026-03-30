import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import crypto from "crypto";
import * as argon2 from "argon2";

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
      select: {
        id: true,
        accounts: {
          where: { providerId: "credential" },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (existingUser?.accounts?.length) {
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

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        accounts: {
          where: { providerId: "credential" },
          select: { id: true },
          take: 1,
        },
      },
    });

    // Create a brand new account through Better Auth when user doesn't exist.
    if (!existingUser) {
      await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
        },
      });
    }

    // Repair path: user exists but has no credential account (e.g. social-only or legacy data).
    if (existingUser && existingUser.accounts.length === 0) {
      const hashedPassword = await argon2.hash(password);

      await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: existingUser.id,
          accountId: email,
          providerId: "credential",
          password: hashedPassword,
        },
      });
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