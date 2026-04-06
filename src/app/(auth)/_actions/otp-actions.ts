"use server";

import { headers } from "next/headers";

function getBaseUrlFromRequestHeaders(requestHeaders: Headers) {
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  }

  return `${proto}://${host}`;
}

async function callOtpApi(payload: Record<string, unknown>) {
  const requestHeaders = await headers();
  const baseUrl = getBaseUrlFromRequestHeaders(requestHeaders);

  const res = await fetch(`${baseUrl}/api/auth/email-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  const result = await res.json();
  return { res, result };
}

export async function sendOtpAction(email: string) {
  const { res, result } = await callOtpApi({ action: "send", email });
  if (!res.ok) return { error: result.error || "Failed to send OTP" };
  return { success: true };
}

export async function verifyOtpAction({
  email, otp, password, name, role,
}: {
  email: string;
  otp: string;
  password: string;
  name: string;
  role: "CUSTOMER" | "PROVIDER";
}) {
  const { res, result } = await callOtpApi({ action: "verify", email, otp, password, name, role });
  if (!res.ok) return { error: result.error || "Invalid OTP" };
  return { success: true };
}