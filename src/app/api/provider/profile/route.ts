import crypto from "crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PHONE_OTP_IDENTIFIER_PREFIX = "provider-profile-phone-otp";
const PHONE_VERIFIED_IDENTIFIER_PREFIX = "provider-profile-phone-verified";
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const PHONE_VERIFIED_TTL_MINUTES = 15;

const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
const pincodeRegex = /^\d{6}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
const otpRegex = /^\d{6}$/;

const profileUpdateSchema = z.object({
	businessName: z.string().max(120).optional(),
	providerType: z.enum(["BOUTIQUE", "RENTAL"]).optional(),
	phone: z.string().regex(phoneRegex, "Invalid phone number"),
	alternativeMobileNumber: z
		.string()
		.optional()
		.refine((value) => !value || phoneRegex.test(value), "Invalid alternate number"),
	address: z.string().max(200).optional(),
	city: z.string().max(80).optional(),
	state: z.string().max(80).optional(),
	pincode: z
		.string()
		.optional()
		.refine((value) => !value || pincodeRegex.test(value), "Invalid pincode"),
	description: z.string().max(600).optional(),
	bankAccountName: z.string().max(120).optional(),
	bankAccountNumber: z.string().max(40).optional(),
	bankIfsc: z
		.string()
		.optional()
		.refine((value) => !value || ifscRegex.test(value), "Invalid IFSC"),
	phoneOtp: z.string().optional(),
});

const sendPhoneOtpSchema = z.object({
	action: z.literal("send-phone-otp"),
	phone: z.string(),
});

const verifyPhoneOtpSchema = z.object({
	action: z.literal("verify-phone-otp"),
	phone: z.string(),
	otp: z.string().regex(otpRegex, "Invalid OTP"),
});

function toNullable(value: string | undefined) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

function normalizeIndianPhone(input: string) {
	const compact = input.trim().replace(/[\s-]/g, "");
	const digits = compact.startsWith("+91") ? compact.slice(3) : compact;

	if (!/^[6-9]\d{9}$/.test(digits)) {
		throw new Error("Invalid Indian mobile number");
	}

	return `+91${digits}`;
}

function buildOtpIdentifier(userId: string, phone: string): string {
	return `${PHONE_OTP_IDENTIFIER_PREFIX}:${userId}:${phone}`;
}

function buildVerifiedIdentifier(userId: string, phone: string): string {
	return `${PHONE_VERIFIED_IDENTIFIER_PREFIX}:${userId}:${phone}`;
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

function isTwilioVerifyMode() {
	return Boolean(
		process.env.TWILIO_ACCOUNT_SID &&
			process.env.TWILIO_AUTH_TOKEN &&
			process.env.TWILIO_VERIFY_SERVICE_SID
	);
}

async function verifyOtpViaTwilioVerify(phone: string, otp: string): Promise<{ valid: boolean; reason?: string }> {
	const accountSid = process.env.TWILIO_ACCOUNT_SID;
	const authToken = process.env.TWILIO_AUTH_TOKEN;
	const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

	if (!accountSid || !authToken || !verifyServiceSid) {
		return { valid: false, reason: "Twilio Verify is not configured" };
	}

	const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
	const params = new URLSearchParams({
		To: phone,
		Code: otp,
	});

	const endpointCandidates = [
		`https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`,
		`https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationChecks`,
	];

	let lastReason = "Failed to verify OTP";

	for (const endpoint of endpointCandidates) {
		const response = await fetch(endpoint, {
			method: "POST",
			headers: {
				Authorization: `Basic ${authHeader}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: params,
		});

		const responseBody = await response.json().catch(() => null) as { status?: string; message?: string } | null;

		if (response.ok) {
			if (responseBody?.status !== "approved") {
				return { valid: false, reason: "Invalid OTP" };
			}

			return { valid: true };
		}

		lastReason = responseBody?.message || lastReason;

		if (response.status !== 404) {
			break;
		}
	}

	return { valid: false, reason: lastReason };
}

async function sendSmsOtp(phone: string, otp: string): Promise<{ success: boolean; message: string; debugOtp?: string }> {
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

		if (!response.ok) {
			const responseBody = await response.json().catch(() => null) as { message?: string } | null;
			if (process.env.NODE_ENV !== "production") {
				return {
					success: true,
					message: `OTP sent in debug mode (${responseBody?.message || "Twilio Verify send failed"})`,
					debugOtp: otp,
				};
			}

			return { success: false, message: responseBody?.message || "Failed to send OTP" };
		}

		return { success: true, message: "OTP sent successfully" };
	}

	if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
		if (process.env.NODE_ENV !== "production") {
			return {
				success: true,
				message: "OTP generated in debug mode. Check server logs.",
				debugOtp: otp,
			};
		}

		return { success: false, message: "SMS service not configured" };
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

	if (!response.ok) {
		if (process.env.NODE_ENV !== "production") {
			return {
				success: true,
				message: "OTP generated in debug mode. Check server logs.",
				debugOtp: otp,
			};
		}

		return { success: false, message: "Failed to send OTP" };
	}

	return { success: true, message: "OTP sent successfully" };
}

async function hasValidOtp(userId: string, phone: string, otp: string) {
	if (isTwilioVerifyMode()) {
		return verifyOtpViaTwilioVerify(phone, otp);
	}

	const identifier = buildOtpIdentifier(userId, phone);
	const latestOtp = await prisma.verification.findFirst({
		where: { identifier },
		orderBy: { createdAt: "desc" },
	});

	if (!latestOtp) {
		return { valid: false, reason: "No OTP found. Please request a new OTP." };
	}

	if (latestOtp.expiresAt < new Date()) {
		return { valid: false, reason: "OTP expired. Please request a new OTP." };
	}

	const expectedHash = hashOtpCode(phone, otp);
	if (latestOtp.value !== expectedHash) {
		return { valid: false, reason: "Invalid OTP" };
	}

	return { valid: true };
}

function unauthorized() {
	return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id) return unauthorized();

	const payload = await req.json();

	const sendParsed = sendPhoneOtpSchema.safeParse(payload);
	if (sendParsed.success) {
		let normalizedPhone = "";
		try {
			normalizedPhone = normalizeIndianPhone(sendParsed.data.phone);
		} catch {
			return Response.json({ success: false, error: "Invalid phone number" }, { status: 400 });
		}

		const identifier = buildOtpIdentifier(session.user.id, normalizedPhone);
		const latestOtp = await prisma.verification.findFirst({
			where: { identifier },
			orderBy: { createdAt: "desc" },
		});

		if (latestOtp) {
			const secondsSinceLastOtp = Math.floor((Date.now() - latestOtp.createdAt.getTime()) / 1000);
			if (secondsSinceLastOtp < OTP_RESEND_COOLDOWN_SECONDS) {
				return Response.json(
					{ success: false, message: `Please wait ${OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastOtp}s before requesting another OTP` },
					{ status: 429 }
				);
			}
		}

		const otp = generateOtpCode();

		if (!isTwilioVerifyMode()) {
			const otpHash = hashOtpCode(normalizedPhone, otp);

			await prisma.verification.create({
				data: {
					identifier,
					value: otpHash,
					expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
				},
			});
		}

		const sendResult = await sendSmsOtp(normalizedPhone, otp);
		if (!sendResult.success) {
			if (!isTwilioVerifyMode()) {
				await prisma.verification.deleteMany({ where: { identifier } });
			}
			return Response.json({ success: false, error: sendResult.message }, { status: 500 });
		}

		return Response.json({
			success: true,
			message: sendResult.message,
			debugOtp: sendResult.debugOtp,
		});
	}

	const verifyParsed = verifyPhoneOtpSchema.safeParse(payload);
	if (verifyParsed.success) {
		let normalizedPhone = "";
		try {
			normalizedPhone = normalizeIndianPhone(verifyParsed.data.phone);
		} catch {
			return Response.json({ success: false, error: "Invalid phone number" }, { status: 400 });
		}

		const otpCheck = await hasValidOtp(session.user.id, normalizedPhone, verifyParsed.data.otp);
		if (!otpCheck.valid) {
			return Response.json({ success: false, error: otpCheck.reason }, { status: 400 });
		}

		const verifiedIdentifier = buildVerifiedIdentifier(session.user.id, normalizedPhone);
		await prisma.verification.deleteMany({ where: { identifier: verifiedIdentifier } });
		await prisma.verification.create({
			data: {
				identifier: verifiedIdentifier,
				value: "verified",
				expiresAt: new Date(Date.now() + PHONE_VERIFIED_TTL_MINUTES * 60 * 1000),
			},
		});

		return Response.json({ success: true, message: "Phone verified successfully" });
	}

	return Response.json({ success: false, error: "Invalid action" }, { status: 400 });
}

export async function PATCH(req: Request) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id) return unauthorized();

	const payload = await req.json();
	const parsed = profileUpdateSchema.safeParse(payload);

	if (!parsed.success) {
		return Response.json({ success: false, error: "Invalid profile data" }, { status: 400 });
	}

	const data = parsed.data;

	const provider = await prisma.providerProfile.findUnique({
		where: { userId: session.user.id },
		select: { id: true, phone: true },
	});

	if (!provider) {
		return Response.json({ success: false, error: "Provider profile not found" }, { status: 404 });
	}

	let normalizedPhone = "";
	let currentPhone = provider.phone;

	try {
		normalizedPhone = normalizeIndianPhone(data.phone);
		currentPhone = normalizeIndianPhone(provider.phone);
	} catch {
		return Response.json({ success: false, error: "Invalid phone number" }, { status: 400 });
	}

	const isPhoneChanged = normalizedPhone !== currentPhone;
	if (isPhoneChanged) {
		const verifiedIdentifier = buildVerifiedIdentifier(session.user.id, normalizedPhone);
		const verifiedMarker = await prisma.verification.findFirst({
			where: {
				identifier: verifiedIdentifier,
				expiresAt: { gt: new Date() },
			},
			orderBy: { createdAt: "desc" },
		});

		if (!verifiedMarker) {
			if (!data.phoneOtp || !otpRegex.test(data.phoneOtp.trim())) {
				return Response.json({ success: false, error: "OTP is required when changing phone number" }, { status: 400 });
			}

			const otpCheck = await hasValidOtp(session.user.id, normalizedPhone, data.phoneOtp.trim());
			if (!otpCheck.valid) {
				return Response.json({ success: false, error: otpCheck.reason }, { status: 400 });
			}
		}

		await prisma.verification.deleteMany({ where: { identifier: buildOtpIdentifier(session.user.id, normalizedPhone) } });
		await prisma.verification.deleteMany({ where: { identifier: verifiedIdentifier } });
	}

	const [updatedProfile] = await prisma.$transaction([
		prisma.providerProfile.update({
			where: { id: provider.id },
			data: {
				businessName: toNullable(data.businessName),
				providerType: data.providerType ?? null,
				phone: normalizedPhone,
				alternate_phone: toNullable(data.alternativeMobileNumber),
				address: toNullable(data.address),
				city: toNullable(data.city),
				state: toNullable(data.state),
				pincode: toNullable(data.pincode),
				description: toNullable(data.description),
				bankAccountName: toNullable(data.bankAccountName),
				bankAccountNumber: toNullable(data.bankAccountNumber),
				bankIfsc: toNullable(data.bankIfsc?.toUpperCase()),
				stepMobileVerified: true,
			},
			select: {
				profilePhoto: true,
				businessName: true,
				providerType: true,
				phone: true,
				alternate_phone: true,
				address: true,
				city: true,
				state: true,
				pincode: true,
				description: true,
				bankAccountName: true,
				bankAccountNumber: true,
				bankIfsc: true,
			},
		}),
		prisma.user.update({
			where: { id: session.user.id },
			data: {
				phone: normalizedPhone,
				address: toNullable(data.address),
				city: toNullable(data.city),
				state: toNullable(data.state),
				pincode: toNullable(data.pincode),
			},
		}),
	]);

	return Response.json({ success: true, profile: updatedProfile });
}
