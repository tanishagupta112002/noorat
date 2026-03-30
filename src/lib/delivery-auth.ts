import { cookies, headers } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const DELIVERY_SESSION_COOKIE = "noorat_delivery_session";
const DELIVERY_SESSION_DAYS = 14;

function getExpiryDate() {
  return new Date(Date.now() + DELIVERY_SESSION_DAYS * 24 * 60 * 60 * 1000);
}

function getClientIp(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

export async function createDeliverySession(deliveryPartnerId: string) {
  const db = prisma as any;
  const token = `${crypto.randomUUID()}_${crypto.randomBytes(24).toString("hex")}`;
  const expiresAt = getExpiryDate();

  const reqHeaders = await headers();

  await db.deliveryPartnerSession.create({
    data: {
      token,
      deliveryPartnerId,
      expiresAt,
      ipAddress: getClientIp(reqHeaders.get("x-forwarded-for")),
      userAgent: reqHeaders.get("user-agent"),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(DELIVERY_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroyDeliverySession() {
  const db = prisma as any;
  const cookieStore = await cookies();
  const token = cookieStore.get(DELIVERY_SESSION_COOKIE)?.value;

  if (token) {
    await db.deliveryPartnerSession.deleteMany({ where: { token } });
  }

  cookieStore.delete(DELIVERY_SESSION_COOKIE);
}

export async function getCurrentDeliveryPartner() {
  const db = prisma as any;
  const cookieStore = await cookies();
  const token = cookieStore.get(DELIVERY_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await db.deliveryPartnerSession.findUnique({
    where: { token },
    include: {
      deliveryPartner: {
        select: {
          id: true,
          email: true,
          fullName: true,
          employeeCode: true,
          status: true,
          phone: true,
          city: true,
          pincode: true,
        },
      },
    },
  });

  if (!session) {
    cookieStore.delete(DELIVERY_SESSION_COOKIE);
    return null;
  }

  if (session.expiresAt < new Date()) {
    await db.deliveryPartnerSession.deleteMany({ where: { token } });
    cookieStore.delete(DELIVERY_SESSION_COOKIE);
    return null;
  }

  return {
    sessionId: session.id,
    token: session.token,
    expiresAt: session.expiresAt,
    deliveryPartner: session.deliveryPartner,
  };
}
