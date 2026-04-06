// src/app/(provider-auth)/provider/onboarding/1_mobile_verification/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import { sendMobileOtpAction, verifyMobileOtpAction, getOnboardingStatus } from "../_actions/onboarding-actions";

const phoneSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, "Enter valid Indian number e.g. +919876543210"),
});
const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type PhoneData = z.infer<typeof phoneSchema>;
type OtpData = z.infer<typeof otpSchema>;

export default function MobileVerification() {
  const router = useRouter();
  const pathname = usePathname();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const phoneForm = useForm<PhoneData>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  // Check onboarding step on mount
  useEffect(() => {
    async function checkStep() {
      try {
        const response = await fetch("/api/provider/access", {
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
          router.replace("/auth");
          return;
        }

        const data = await response.json();
        const rawNextStep = typeof data?.providerHref === "string" ? data.providerHref : "/auth";
        const nextStep =
          rawNextStep === "/become-a-provider/onboarding"
            ? "/become-a-provider/onboarding/1_mobile_verification"
            : rawNextStep;

        if (nextStep !== pathname) {
          router.replace(nextStep);
        }
      } catch {
        router.replace("/auth");
      }
    }
    void checkStep();
  }, [pathname, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Initialize Twilio Verify (handled server-side, no client initialization needed)
  function initVerification() {
    // Twilio Verify OTP is handled by backend only
  }

  // Send OTP via Twilio
  const sendOtp = phoneForm.handleSubmit(async (data) => {
    setSendingOtp(true);
    setError(null);
    setSuccessMessage(null);
    setDebugOtp(null);

    try {
      const res = await sendMobileOtpAction(data.phone);
      if (!res.success) {
        if (res.cooldownSeconds) setResendCooldown(res.cooldownSeconds);
        throw new Error(res.message || "Failed to send OTP");
      }

      setPhone(data.phone);
      setStep("otp");
      otpForm.reset({ otp: "" });
      setResendCooldown(60);
      setSuccessMessage(res.message || "OTP sent successfully to " + data.phone);
      setDebugOtp(res.debugOtp || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP";
      setError(msg);
    } finally {
      setSendingOtp(false);
    }
  });

  // Verify OTP
  const verifyOtp = otpForm.handleSubmit(async (data) => {
    setVerifyingOtp(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await verifyMobileOtpAction({ phone, otp: data.otp });
      if (!res.success) throw new Error(res.message || "Verification failed");

      setSuccessMessage("Mobile verified! Moving to next step...");
      const { nextStep } = await getOnboardingStatus();
      router.push(nextStep);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid OTP";
      setError(msg);
    } finally {
      setVerifyingOtp(false);
    }
  });

  const resendOtp = async () => {
    if (resendCooldown > 0 || !phone) return;
    setSendingOtp(true);
    setError(null);
    setSuccessMessage(null);
    setDebugOtp(null);

    try {
      const res = await sendMobileOtpAction(phone);
      if (!res.success) {
        if (res.cooldownSeconds) setResendCooldown(res.cooldownSeconds);
        throw new Error(res.message || "Failed to resend OTP");
      }

      setResendCooldown(60);
      otpForm.reset({ otp: "" });
      setSuccessMessage("New OTP sent successfully.");
      setDebugOtp(res.debugOtp || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend OTP";
      setError(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <div className="flex w-full justify-center px-0 sm:px-4">
      <Card className="border-foreground w-full max-w-md bg-white sm:max-w-xl md:max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Verify Your Mobile Number</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 md:space-y-6">
          {step === "phone" ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm md:text-base">
                  Mobile Number
                </Label>
                <Input
                  id="phone"
                  placeholder="+919876543210"
                  autoComplete="tel"
                  className="h-11 text-base"
                  {...phoneForm.register("phone")}
                />
                {phoneForm.formState.errors.phone && (
                  <p className="text-xs text-red-500 md:text-sm">
                    {phoneForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700 md:text-sm">
                  ⚠ {error}
                </p>
              )}
              {successMessage && (
                <p className="rounded-lg bg-green-50 p-2 text-xs text-green-700 md:text-sm">
                  {successMessage}
                </p>
              )}
              {debugOtp && (
                <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800 md:text-sm">
                  Debug OTP (local only): <span className="font-semibold tracking-widest">{debugOtp}</span>
                </p>
              )}

              <Button type="submit" className="h-11 w-full text-base" disabled={sendingOtp}>
                {sendingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm md:text-base">
                  Enter OTP sent to {phone}
                </Label>
                <InputOTP
                  maxLength={6}
                  value={otpForm.watch("otp")}
                  onChange={(value) =>
                    otpForm.setValue("otp", value, { shouldValidate: true })
                  }
                >
                  <InputOTPGroup className="gap-1 sm:gap-2">
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                {otpForm.formState.errors.otp && (
                  <p className="text-xs text-red-500 md:text-sm">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700 md:text-sm">
                  {error}
                </p>
              )}

              {debugOtp && (
                <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800 md:text-sm">
                  Debug OTP (local only): <span className="font-semibold tracking-widest">{debugOtp}</span>
                </p>
              )}

              <Button
                type="submit"
                className="h-11 w-full text-base"
                disabled={verifyingOtp || otpForm.watch("otp").length !== 6}
              >
                {verifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify OTP
              </Button>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-left text-xs font-medium text-muted-foreground hover:underline md:text-sm"
                >
                  Change number
                </button>

                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resendCooldown > 0 || sendingOtp}
                  className="text-right text-xs font-medium text-primary disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
