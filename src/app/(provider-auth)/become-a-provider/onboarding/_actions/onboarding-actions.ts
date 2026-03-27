// src/app/(provider-auth)/provider/onboarding/_actions/onboarding-actions.ts
"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { getNextAllowedStep } from "@/lib/onboarding-steps";
import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

// ✅ Common Response Type
type ActionResponse = {
  success: boolean;
  message?: string;
  cooldownSeconds?: number;
  debugOtp?: string;
};

const MOBILE_OTP_IDENTIFIER_PREFIX = "provider-mobile-otp";
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

const mobileSchema = z.string().regex(/^\+91[6-9]\d{9}$/, "Invalid Indian mobile number");
const otpCodeSchema = z.string().regex(/^\d{6}$/, "Invalid OTP");

const STEP_PATHS = {
  step1: "/become-a-provider/onboarding/1_mobile_verification",
  step2: "/become-a-provider/onboarding/2_identity_verification",
  step3: "/become-a-provider/onboarding/3_store_details",
  step4: "/become-a-provider/onboarding/4_pickup_address",
  step5: "/become-a-provider/onboarding/5_bank_account",
  step6: "/become-a-provider/onboarding/6_first_listing",
} as const;

type ProfileStepStatus = {
  stepMobileVerified: boolean;
  stepIdentityVerified: boolean;
  stepStoreDetails: boolean;
  stepPickupAddress: boolean;
  stepBankDetails: boolean;
  stepFirstListing: boolean;
};

function ensureExpectedStep(
  profile: ProfileStepStatus,
  expectedPath: string
): ActionResponse | null {
  const nextAllowed = getNextAllowedStep(profile);
  if (nextAllowed !== expectedPath) {
    return {
      success: false,
      message: "Please complete previous onboarding steps first",
    };
  }

  return null;
}

function buildOtpIdentifier(userId: string, phone: string): string {
  return `${MOBILE_OTP_IDENTIFIER_PREFIX}:${userId}:${phone}`;
}

function generateOtpCode(): string {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH;
  return crypto.randomInt(min, max).toString();
}

function hashOtpCode(phone: string, otp: string): string {
  const secret = process.env.MOBILE_OTP_SECRET ?? "dev-mobile-otp-secret";
  return crypto.createHash("sha256").update(`${phone}:${otp}:${secret}`).digest("hex");
}

async function sendSmsOtp(phone: string, otp: string): Promise<ActionResponse> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (accountSid && authToken && verifyServiceSid) {
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const params = new URLSearchParams({
      To: phone,
      Channel: "sms",
    });

    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      }
    );

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      const reason =
        (responseBody as { message?: string } | null)?.message ||
        "Failed to send OTP via Twilio Verify";
      console.error("Twilio Verify send failed:", responseBody);

      if (process.env.NODE_ENV !== "production") {
        console.warn(`[DEV OTP FALLBACK] ${phone} => ${otp}`);
        return {
          success: true,
          message: `SMS delivery failed (${reason}). Use debug OTP below for local testing.`,
          debugOtp: otp,
        };
      }

      return { success: false, message: reason };
    }

    return { success: true, message: "OTP sent successfully" };
  }

  if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV OTP] ${phone} => ${otp}`);
      return {
        success: true,
        message: "OTP generated in dev mode. Check server logs.",
      };
    }

    return {
      success: false,
      message: "SMS service is not configured. Please set Twilio environment variables.",
    };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const params = new URLSearchParams({
    To: phone,
    Body: `Your Tanitwirl OTP is ${otp}. It is valid for ${OTP_EXPIRY_MINUTES} minutes.`,
  });

  if (messagingServiceSid) {
    params.append("MessagingServiceSid", messagingServiceSid);
  } else if (fromNumber) {
    params.append("From", fromNumber);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const reason =
      (responseBody as { message?: string; code?: number } | null)?.message ||
      "Failed to send OTP SMS";
    console.error("Twilio SMS send failed:", responseBody);

    if (process.env.NODE_ENV !== "production") {
      console.warn(`[DEV OTP FALLBACK] ${phone} => ${otp}`);
      return {
        success: true,
        message: `SMS delivery failed (${reason}). Use debug OTP below for local testing.`,
        debugOtp: otp,
      };
    }

    return { success: false, message: reason };
  }

  const twilioResult = responseBody as
    | { sid?: string; status?: string; error_message?: string | null }
    | null;

  console.log("Twilio message queued:", {
    sid: twilioResult?.sid,
    status: twilioResult?.status,
    to: phone,
  });

  if (twilioResult?.status === "failed" || twilioResult?.status === "undelivered") {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[DEV OTP FALLBACK] ${phone} => ${otp}`);
      return {
        success: true,
        message: `SMS was not delivered (${twilioResult.error_message || "unknown reason"}). Use debug OTP below for local testing.`,
        debugOtp: otp,
      };
    }

    return {
      success: false,
      message: twilioResult.error_message || "OTP could not be delivered",
    };
  }

  if (process.env.NODE_ENV !== "production" && process.env.MOBILE_OTP_DEBUG === "true") {
    return {
      success: true,
      message: `OTP sent. Debug OTP: ${otp}`,
      debugOtp: otp,
    };
  }

  return { success: true, message: "OTP sent successfully" };
}

async function verifyOtpViaTwilioVerify(phone: string, otp: string): Promise<ActionResponse> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifyServiceSid) {
    return { success: false, message: "Twilio Verify is not configured" };
  }

  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const params = new URLSearchParams({
    To: phone,
    Code: otp,
  });

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    }
  );

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const reason =
      (responseBody as { message?: string } | null)?.message ||
      "Failed to verify OTP";
    console.error("Twilio Verify check failed:", responseBody);
    return { success: false, message: reason };
  }

  const status = (responseBody as { status?: string } | null)?.status;
  if (status !== "approved") {
    return { success: false, message: "Invalid OTP" };
  }

  return { success: true, message: "Mobile verified successfully" };
}

async function getCurrentSessionUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

async function getProviderStepStatus(userId: string): Promise<ProfileStepStatus | null> {
  return prisma.providerProfile.findUnique({
    where: { userId },
    select: {
      stepMobileVerified: true,
      stepIdentityVerified: true,
      stepStoreDetails: true,
      stepPickupAddress: true,
      stepBankDetails: true,
      stepFirstListing: true,
    },
  });
}

// ─────────────────────────────────────────────
// Helper: Get current session & profile
// ─────────────────────────────────────────────
async function getCurrentProviderProfile() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    throw new Error("Provider profile not found");
  }

  return { session, profile };
}

// ─────────────────────────────────────────────
// Step 1: Mobile Verification
// ─────────────────────────────────────────────
export async function getOnboardingStatus(): Promise<{
  authenticated: boolean;
  nextStep: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return { authenticated: false, nextStep: "/auth" };
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        stepMobileVerified: true,
        stepIdentityVerified: true,
        stepStoreDetails: true,
        stepPickupAddress: true,
        stepBankDetails: true,
        stepFirstListing: true,
      },
    });
    return { authenticated: true, nextStep: getNextAllowedStep(profile) };
  } catch {
    return { authenticated: false, nextStep: "/auth" };
  }
}

// ─────────────────────────────────────────────
export async function sendMobileOtpAction(phone: string): Promise<ActionResponse> {
  try {
    const normalizedPhone = mobileSchema.parse(phone.trim());
    const userId = await getCurrentSessionUserId();
    const profileSteps = await getProviderStepStatus(userId);

    if (profileSteps) {
      const stepGuard = ensureExpectedStep(profileSteps, STEP_PATHS.step1);
      if (stepGuard) return stepGuard;
    }

    if (profileSteps?.stepMobileVerified) {
      return { success: false, message: "Mobile already verified" };
    }

    const isTwilioVerifyMode = Boolean(process.env.TWILIO_VERIFY_SERVICE_SID);
    if (isTwilioVerifyMode) {
      return await sendSmsOtp(normalizedPhone, generateOtpCode());
    }

    const identifier = buildOtpIdentifier(userId, normalizedPhone);
    const latestOtp = await prisma.verification.findFirst({
      where: { identifier },
      orderBy: { createdAt: "desc" },
    });

    if (latestOtp) {
      const secondsSinceLastOtp = Math.floor((Date.now() - latestOtp.createdAt.getTime()) / 1000);
      if (secondsSinceLastOtp < OTP_RESEND_COOLDOWN_SECONDS) {
        const waitSeconds = OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastOtp;
        return {
          success: false,
          message: `Please wait ${waitSeconds}s before requesting another OTP`,
          cooldownSeconds: waitSeconds,
        };
      }
    }

    const otp = generateOtpCode();
    const otpHash = hashOtpCode(normalizedPhone, otp);

    await prisma.verification.deleteMany({ where: { identifier } });
    await prisma.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier,
        value: otpHash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    return await sendSmsOtp(normalizedPhone, otp);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        message: err.issues[0]?.message || "Invalid phone number",
      };
    }

    return {
      success: false,
      message: "Failed to send OTP",
    };
  }
}

export async function verifyMobileOtpAction({
  phone,
  otp,
}: {
  phone: string;
  otp: string;
}): Promise<ActionResponse> {
  try {
    const normalizedPhone = mobileSchema.parse(phone.trim());
    const normalizedOtp = otpCodeSchema.parse(otp.trim());

    const userId = await getCurrentSessionUserId();
    const profileSteps = await getProviderStepStatus(userId);
    if (profileSteps) {
      const stepGuard = ensureExpectedStep(profileSteps, STEP_PATHS.step1);
      if (stepGuard) return stepGuard;
    }

    const isTwilioVerifyMode = Boolean(process.env.TWILIO_VERIFY_SERVICE_SID);
    if (isTwilioVerifyMode) {
      const twilioResult = await verifyOtpViaTwilioVerify(normalizedPhone, normalizedOtp);
      if (!twilioResult.success) return twilioResult;
    } else {
      const identifier = buildOtpIdentifier(userId, normalizedPhone);
      const verification = await prisma.verification.findFirst({
        where: {
          identifier,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!verification) {
        return { success: false, message: "OTP expired. Please request a new one." };
      }

      const expectedHash = hashOtpCode(normalizedPhone, normalizedOtp);
      if (verification.value !== expectedHash) {
        return { success: false, message: "Invalid OTP" };
      }

      await prisma.verification.deleteMany({ where: { identifier } });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    await prisma.providerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        phone: normalizedPhone,
        stepMobileVerified: true,
      },
      update: {
        phone: normalizedPhone,
        stepMobileVerified: true,
      },
    });

    return { success: true, message: "Mobile verified successfully" };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        message: err.issues[0]?.message || "Invalid input",
      };
    }

    return { success: false, message: "Something went wrong" };
  }
}

// ─────────────────────────────────────────────
// Step 2: Identity
// ─────────────────────────────────────────────
const identitySchema = z.object({
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number"),
  gstNumber: z
    .string()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Zz][A-Z\d]$/, "Invalid GST number")
    .optional(),
});

export async function submitIdentityAction(formData: FormData): Promise<ActionResponse> {
  try {
    const { profile } = await getCurrentProviderProfile();
    const stepGuard = ensureExpectedStep(profile, STEP_PATHS.step2);
    if (stepGuard) return stepGuard;

    const rawPan = formData.get("panNumber");
    const rawGst = formData.get("gstNumber");

    const data = {
      panNumber: typeof rawPan === "string" ? rawPan.trim().toUpperCase() : "",
      gstNumber:
        typeof rawGst === "string" && rawGst.trim().length > 0
          ? rawGst.trim().toUpperCase()
          : undefined,
    };

    const validated = identitySchema.parse(data);

    const idDocumentEntry = formData.get("idDocument");
    let savedIdDocument: string | undefined;

    if (idDocumentEntry instanceof File && idDocumentEntry.size > 0) {
      const allowedMimeTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!allowedMimeTypes.includes(idDocumentEntry.type)) {
        return { success: false, message: "Only PDF, JPG, PNG, and WEBP files are allowed" };
      }

      const maxSizeBytes = 5 * 1024 * 1024;
      if (idDocumentEntry.size > maxSizeBytes) {
        return { success: false, message: "ID document must be smaller than 5MB" };
      }

      const extFromName = path.extname(idDocumentEntry.name || "").toLowerCase();
      const extByMime: Record<string, string> = {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
      };
      const extension = extFromName || extByMime[idDocumentEntry.type] || ".bin";

      const fileName = `${profile.userId}-${Date.now()}${extension}`;
      const relativePath = `/uploads/provider-identity/${fileName}`;
      const absoluteDir = path.join(process.cwd(), "public", "uploads", "provider-identity");
      const absoluteFilePath = path.join(absoluteDir, fileName);

      await mkdir(absoluteDir, { recursive: true });

      const fileBuffer = Buffer.from(await idDocumentEntry.arrayBuffer());
      await writeFile(absoluteFilePath, fileBuffer);

      savedIdDocument = relativePath;
    }

    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        panNumber: validated.panNumber,
        idDocument: savedIdDocument,
        stepIdentityVerified: true,
      },
    });

    return { success: true, message: "Identity verified" };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, message: err.issues[0]?.message || "Invalid identity details" };
    }

    if (err instanceof Error) {
      return { success: false, message: err.message };
    }

    return { success: false, message: "Failed to save identity details" };
  }
}

// ─────────────────────────────────────────────
// Step 3: Store Details
// ─────────────────────────────────────────────
export async function submitStoreDetailsAction(data: {
  businessName: string;
  providerType: "BOUTIQUE" | "RENTAL";
  description?: string;
}): Promise<ActionResponse> {
  try {
    const { profile } = await getCurrentProviderProfile();
    const stepGuard = ensureExpectedStep(profile, STEP_PATHS.step3);
    if (stepGuard) return stepGuard;

    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        businessName: data.businessName,
        providerType: data.providerType,
        description: data.description,
        stepStoreDetails: true,
      },
    });

    return { success: true, message: "Store details saved" };
  } catch (err) {
    return { success: false, message: "Failed to save store details" };
  }
}

// ─────────────────────────────────────────────
// Step 4: Pickup Address
// ─────────────────────────────────────────────
const pickupSchema = z.object({
  address: z.string().min(10),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
});

export async function submitPickupAddressAction(formData: FormData): Promise<ActionResponse> {
  try {
    const { profile } = await getCurrentProviderProfile();
    const stepGuard = ensureExpectedStep(profile, STEP_PATHS.step4);
    if (stepGuard) return stepGuard;

    const data = {
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      pincode: formData.get("pincode") as string,
    };

    const validated = pickupSchema.parse(data);

    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        address: validated.address,
        city: validated.city,
        state: validated.state,
        pincode: validated.pincode,
        stepPickupAddress: true,
      },
    });

    return { success: true, message: "Address saved" };
  } catch (err) {
    return { success: false, message: "Invalid address data" };
  }
}

// ─────────────────────────────────────────────
// Step 5: Bank Details
// ─────────────────────────────────────────────
const bankSchema = z.object({
  bankAccountNumber: z.string().min(9).max(18),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
  bankAccountName: z.string().min(3),
});

export async function submitBankDetailsAction(
  data: z.infer<typeof bankSchema>
): Promise<ActionResponse> {
  try {
    const { profile } = await getCurrentProviderProfile();
    const stepGuard = ensureExpectedStep(profile, STEP_PATHS.step5);
    if (stepGuard) return stepGuard;

    const validated = bankSchema.parse(data);

    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        bankAccountNumber: validated.bankAccountNumber,
        bankIfsc: validated.bankIfsc,
        bankAccountName: validated.bankAccountName,
        stepBankDetails: true,
      },
    });

    return { success: true, message: "Bank details saved" };
  } catch (err) {
    return { success: false, message: "Invalid bank details" };
  }
}

// ─────────────────────────────────────────────
// Step 6: First Listing
// ─────────────────────────────────────────────
const listingSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  fabric: z.string().min(2, "Fabric must be at least 2 characters"),
  description: z.string().max(2000).optional(),
  size: z.string().min(1, "Size is required"),
  originalPrice: z.coerce.number().positive("Original price must be a positive number"),
  price: z.coerce.number().positive("Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  color: z.string().min(2, "Color is required"),
}).refine((data) => data.originalPrice >= data.price, {
  message: "Original price must be greater than or equal to rental price",
  path: ["originalPrice"],
});

async function saveListingImages(providerProfileId: string, images: File[]): Promise<string[]> {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSizeBytes = 5 * 1024 * 1024;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "provider-listings");

  await mkdir(uploadDir, { recursive: true });

  return Promise.all(
    images.map(async (image, index) => {
      if (!allowedMimeTypes.includes(image.type)) {
        throw new Error("Only JPG, PNG, and WEBP images are allowed");
      }

      if (image.size > maxSizeBytes) {
        throw new Error("Each listing image must be smaller than 5MB");
      }

      const extension =
        path.extname(image.name || "").toLowerCase() ||
        ({
          "image/jpeg": ".jpg",
          "image/png": ".png",
          "image/webp": ".webp",
        } as const)[image.type] ||
        ".bin";
      const fileName = `${providerProfileId}-${Date.now()}-${index}${extension}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, Buffer.from(await image.arrayBuffer()));

      return `/uploads/provider-listings/${fileName}`;
    })
  );
}

export async function completeFirstListingAction(formData: FormData): Promise<ActionResponse> {
  try {
    const { profile, session } = await getCurrentProviderProfile();
    const stepGuard = ensureExpectedStep(profile, STEP_PATHS.step6);
    if (stepGuard) return stepGuard;

    if (profile.stepFirstListing) {
      return { success: false, message: "Already completed" };
    }

    const data = {
      title: formData.get("title") as string,
      fabric: formData.get("fabric") as string,
      description: (formData.get("description") as string) || "",
      size: formData.get("size") as string,
      originalPrice: formData.get("originalPrice") as string,
      price: formData.get("price") as string,
      category: formData.get("category") as string,
      color: formData.get("color") as string,
    };

    const validated = listingSchema.parse(data);
    const imageEntries = formData
      .getAll("images")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (imageEntries.length === 0) {
      return { success: false, message: "At least one listing image is required" };
    }

    const imagePaths = await saveListingImages(profile.id, imageEntries);

    await prisma.$transaction(async (tx) => {
      await tx.listing.create({
        data: {
          providerId: profile.id,
          title: validated.title,
          Fabric: validated.fabric,
          description: validated.description?.trim() || null,
          size: validated.size,
          originalPrice: validated.originalPrice,
          price: validated.price,
          category: validated.category,
          color: validated.color,
          images: imagePaths,
          status: true,
        } as any,
      });

      await tx.providerProfile.update({
        where: { id: profile.id },
        data: { stepFirstListing: true },
      });

      await tx.user.update({
        where: { id: session.user.id },
        data: { role: "PROVIDER" },
      });
    });

    return { success: true, message: "Onboarding completed 🎉" };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, message: err.issues[0]?.message || "Invalid listing details" };
    }

    return { success: false, message: "Failed to complete onboarding" };
  }
}