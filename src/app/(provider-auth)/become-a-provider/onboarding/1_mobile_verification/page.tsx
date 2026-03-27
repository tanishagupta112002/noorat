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
    <div className="flex justify-center">
    <Card className="border-foreground w-full max-w-[600px] bg-white">
      <CardHeader>
        <CardTitle className="text-xl">Verify Your Mobile Number</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        

        {step === "phone" ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <Label htmlFor="phone">Mobile Number</Label>
              <Input
                id="phone"
                placeholder="+919876543210"
                autoComplete="tel"
                {...phoneForm.register("phone")}
              />
              {phoneForm.formState.errors.phone && (
                <p className="mt-1 text-sm text-red-500">{phoneForm.formState.errors.phone.message}</p>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
            {debugOtp && (
              <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Dev OTP: <span className="font-semibold tracking-wider">{debugOtp}</span>
              </p>
            )}

            <Button type="submit" className="w-full" disabled={sendingOtp}>
              {sendingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label>Enter OTP sent to {phone}</Label>
              <InputOTP
                maxLength={6}
                value={otpForm.watch("otp")}
                onChange={(value) => otpForm.setValue("otp", value, { shouldValidate: true })}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              {otpForm.formState.errors.otp && (
                <p className="text-sm text-red-500">{otpForm.formState.errors.otp.message}</p>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
            {debugOtp && (
              <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Dev OTP: <span className="font-semibold tracking-wider">{debugOtp}</span>
              </p>
            )}

            <Button type="submit" className="w-full" disabled={verifyingOtp || otpForm.watch("otp").length !== 6}>
              {verifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify OTP
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="font-medium text-muted-foreground hover:text-foreground"
              >
                Change number
              </button>

              <button
                type="button"
                onClick={resendOtp}
                disabled={resendCooldown > 0 || sendingOtp}
                className="font-medium text-primary disabled:cursor-not-allowed disabled:opacity-60"
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