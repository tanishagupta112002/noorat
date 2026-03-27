// src/app/(provider-auth)/provider/onboarding/1_mobile_verification/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Smartphone, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import { sendMobileOtpAction, verifyMobileOtpAction, getOnboardingStatus } from "../_actions/onboarding-actions";
import { useSession } from "@/hooks/user-session";

const phoneSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, "Invalid Indian mobile number"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type PhoneData = z.infer<typeof phoneSchema>;
type OtpData = z.infer<typeof otpSchema>;

export default function MobileVerification() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthMessage, setHealthMessage] = useState<string | null>(null);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);

  const phoneForm = useForm<PhoneData>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  // On mount: fetch session & profile, redirect if not allowed
  useEffect(() => {
    async function checkStep() {
      try {
        const { nextStep } = await getOnboardingStatus();
        if (nextStep !== "/become-a-provider/onboarding/1_mobile_verification") {
          router.replace(nextStep);
          return;
        }
        setInitialLoading(false);
      } catch {
        router.replace("/auth");
      }
    }
    if (!sessionLoading) checkStep();
  }, [session, sessionLoading, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Send OTP
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
      setSuccessMessage(res.message || "OTP sent successfully.");
      setDebugOtp(res.debugOtp ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    }

    setSendingOtp(false);
  });

  // Verify OTP
  const verifyOtp = otpForm.handleSubmit(async (data) => {
    setVerifyingOtp(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await verifyMobileOtpAction({ phone, otp: data.otp });
      if (!res.success) throw new Error(res.message || "Failed to verify OTP");

      setSuccessMessage("Mobile verified successfully. Moving to next step...");
      const { nextStep } = await getOnboardingStatus();
      router.push(nextStep);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP");
    }

    setVerifyingOtp(false);
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
      setDebugOtp(res.debugOtp ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    }

    setSendingOtp(false);
  };

  const checkSmsSetup = async () => {
    setHealthLoading(true);
    setHealthMessage(null);
    setHealthOk(null);

    try {
      const res = await fetch("/api/provider/otp-health", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await res.json()) as { ok: boolean; message: string };

      setHealthOk(Boolean(data.ok));
      setHealthMessage(data.message || "Health check completed");
    } catch {
      setHealthOk(false);
      setHealthMessage("Unable to run OTP health check");
    }

    setHealthLoading(false);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking onboarding status...
      </div>
    );
  }

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
              <Label htmlFor="phone" className="text-sm md:text-base">Mobile Number</Label>
              <Input
                id="phone"
                placeholder="+919876543210"
                autoComplete="tel"
                className="h-11 text-base"
                {...phoneForm.register("phone")}
              />
              {phoneForm.formState.errors.phone && (
                <p className="text-xs text-red-500 md:text-sm">{phoneForm.formState.errors.phone.message}</p>
              )}
            </div>

            {error && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700 md:text-sm">⚠ {error}</p>}
            {successMessage && <p className="rounded-lg bg-green-50 p-2 text-xs text-green-700 md:text-sm">✓ {successMessage}</p>}
            {debugOtp && (
              <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 md:text-sm">
                <span className="block md:inline">Dev OTP:</span> <span className="font-semibold tracking-wider">{debugOtp}</span>
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
              <Label className="text-sm md:text-base">Enter OTP sent to {phone}</Label>
              <InputOTP
                maxLength={6}
                value={otpForm.watch("otp")}
                onChange={(value) => otpForm.setValue("otp", value, { shouldValidate: true })}
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
                <p className="text-xs text-red-500 md:text-sm">{otpForm.formState.errors.otp.message}</p>
              )}
            </div>

            {error && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700 md:text-sm">⚠ {error}</p>}
            {successMessage && <p className="rounded-lg bg-green-50 p-2 text-xs text-green-700 md:text-sm">✓ {successMessage}</p>}
            {debugOtp && (
              <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 md:text-sm">
                <span className="block md:inline">Dev OTP:</span> <span className="font-semibold tracking-wider">{debugOtp}</span>
              </p>
            )}

            <Button type="submit" className="h-11 w-full text-base" disabled={verifyingOtp || otpForm.watch("otp").length !== 6}>
              {verifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify OTP
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between md:text-sm">
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