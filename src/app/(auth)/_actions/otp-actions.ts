"use server";

export async function sendOtpAction(email: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/email-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "send", email }),
  });

  const result = await res.json();
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
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/email-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", email, otp, password, name, role }),
  });

  const result = await res.json();
  if (!res.ok) return { error: result.error || "Invalid OTP" };
  return { success: true };
}