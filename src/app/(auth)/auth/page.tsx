"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

import { sendOtpAction, verifyOtpAction } from "../_actions/otp-actions";
import { authClient } from "@/lib/auth-client";
import { FcGoogle } from "react-icons/fc";

// ─────────────────────────────────────────────
// Zod Schemas
// ─────────────────────────────────────────────

const initialSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["CUSTOMER", "PROVIDER"]),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type InitialFormData = z.infer<typeof initialSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirect = searchParams.get("redirect");
  const requestedMode = searchParams.get("mode");

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<"initial" | "otp">("initial");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getPostAuthRedirect = () => {
    if (redirect) {
      return redirect;
    }

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      return "/account";
    }

    return "/profile";
  };

  const initialForm = useForm<InitialFormData>({
    resolver: zodResolver(initialSchema),
    defaultValues: {
      role: "CUSTOMER",
    },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  // ─────────────────────────────────────────────
  // SIGN UP STEP 1 → SEND OTP
  // ─────────────────────────────────────────────
  const onSendOtp = initialForm.handleSubmit(async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await sendOtpAction(data.email);

      if (result.error) {
        setError(result.error);
        return;
      }

      setEmailSentTo(data.email);
      setStep("otp");
    } catch {
      setError("Could not send OTP");
    } finally {
      setIsLoading(false);
    }
  });

  // ─────────────────────────────────────────────
  // SIGN UP STEP 2 → VERIFY OTP
  // ─────────────────────────────────────────────
  const onVerifyOtp = otpForm.handleSubmit(async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      const initialData = initialForm.getValues();

      const result = await verifyOtpAction({
        email: initialData.email,
        otp: data.otp,
        password: initialData.password,
        name: initialData.name || "",
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      const { error: signInError } = await authClient.signIn.email({
        email: initialData.email,
        password: initialData.password,
      });

      if (signInError) {
        setSuccessMessage("Account created successfully. Please login to continue.");
        setMode("signin");
        setStep("initial");
        setEmailSentTo(null);
        otpForm.reset();
        return;
      }

      router.replace(getPostAuthRedirect());
    } catch {
      setError("Verification failed");
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    if (requestedMode === "signup") {
      setMode("signup");
      setStep("initial");
    } else if (requestedMode === "signin") {
      setMode("signin");
      setStep("initial");
    }
  }, [requestedMode]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ─────────────────────────────────────────────
  // SIGN IN
  // ─────────────────────────────────────────────
  const signInUser = initialForm.handleSubmit(async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setError(error.message || "Login failed");
        return;
      }

      router.push(getPostAuthRedirect());
    } catch {
      setError("Login failed");
    } finally {
      setIsLoading(false);
    }
  });

  // ─────────────────────────────────────────────
  // GOOGLE SIGN IN
  // ─────────────────────────────────────────────
  const signInWithGoogle = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: getPostAuthRedirect(),
      });
    } catch {
      alert("Google sign-in failed");
    }
  };


  return (
    <div className="min-h-screen grid lg:grid-cols-2 w-full overflow-hidden">
      {/* LEFT IMAGE */}
      <div className="relative w-full">
        <div className="relative h-[60vh] md:h-[80vh] lg:h-screen">
          <img
            src="/images/auth.png"
            alt="Fashion"
            className="h-full w-full object-cover object-top"
          />
        </div>

        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/50 to-transparent" />

        <div className="absolute bottom-20 left-12 text-white">
          <h2 className="text-5xl font-serif">Welcome to noorat</h2>

          <p className="mt-3 text-lg opacity-90">
            Discover, rent & share fashion effortlessly.
          </p>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="flex items-center justify-center px-6 py-12 lg:px-16 bg-white">
       
        <div className="w-full max-w-md space-y-8">
          <Logo className="flex justify-center ml-40 -mb-5 " />
          {successMessage && (
                <p className="text-green-600 text-center mb-4">
                  {successMessage}
                </p>
              )}

          <div className="text-center">
            <h1 className="text-3xl font-medium">
              {mode === "signup"
                ? step === "initial"
                  ? "Create your account"
                  : "Verify your email"
                : "Sign in to your account"}
            </h1>

            <p className="text-sm text-muted-foreground mt-2">
              {mode === "signup"
                ? "Join noorat and start your style journey"
                : "Welcome back"}
            </p>
          </div>

          {/* GOOGLE BUTTON */}
          <Button
            variant="outline"
            className="w-full h-11 flex items-center gap-2"
            onClick={signInWithGoogle}
          >
            <FcGoogle className="w-5 h-5" />
            Continue with Google
          </Button>

          {/* SIGNUP INITIAL FORM */}
          {mode === "signup" && step === "initial" && (
            <form onSubmit={onSendOtp} className="space-y-5">
              

              <div>
                <Label>Full name</Label>
                <Input {...initialForm.register("name")} />
              </div>

              <div>
                <Label>Email</Label>
                <Input type="email" {...initialForm.register("email")} />
              </div>

              <div>
                <Label>Password</Label>
                <Input type="password" {...initialForm.register("password")} />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 animate-spin" />}
                Send OTP
              </Button>
            </form>
          )}

          {/* OTP VERIFY */}
          {mode === "signup" && step === "otp" && (
            <form onSubmit={onVerifyOtp} className="space-y-5">
              

              <Label>Enter OTP sent to {emailSentTo}</Label>

              <Input
                maxLength={6}
                className="text-center tracking-widest text-xl"
                {...otpForm.register("otp")}
              />

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 animate-spin" />}
                Verify & Create Account
              </Button>
            </form>
          )}

          {/* SIGN IN FORM */}
          {mode === "signin" && (
            <form onSubmit={signInUser} className="space-y-5">
              

              <div>
                <Label>Email</Label>
                <Input type="email" {...initialForm.register("email")} />
              </div>

              <div>
                <Label>Password</Label>
                <Input type="password" {...initialForm.register("password")} />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 animate-spin" />}
                Sign In
              </Button>
            </form>
          )}

          <div className="relative my-6">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-4 text-sm text-muted-foreground">
                or
              </span>
            </div>
          </div>

          {/* TOGGLE */}
          <p className="text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  className="text-primary hover:underline"
                  onClick={() => {
                    setMode("signin");
                    setStep("initial");
                    setError(null);
                  }}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don’t have an account?{" "}
                <button
                  className="text-primary hover:underline"
                  onClick={() => {
                    setMode("signup");
                    setStep("initial");
                    setError(null);
                  }}
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  );
}
