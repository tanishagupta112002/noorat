import { prisma } from "@/lib/prisma";
import { createEmployeeCode, hashInviteToken } from "@/lib/delivery-workflow";
import * as argon2 from "argon2";

export async function POST(req: Request) {
  const db = prisma as any;
  const body = await req.json();
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token || password.length < 8) {
    return Response.json(
      { success: false, error: "Valid invite token and password (8+ chars) are required" },
      { status: 400 },
    );
  }

  const tokenHash = hashInviteToken(token);

  const invite = await db.deliveryPartnerInvite.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return Response.json({ success: false, error: "Invite is invalid or expired" }, { status: 400 });
  }

  try {
    const hashedPassword = await argon2.hash(password);
    const existingDeliveryPartner = await db.deliveryPartnerProfile.findUnique({
      where: { email: invite.email },
      select: {
        id: true,
      },
    });

    await db.$transaction(async (tx: any) => {
      if (existingDeliveryPartner) {
        await tx.deliveryPartnerProfile.update({
          where: { id: existingDeliveryPartner.id },
          data: {
            fullName: invite.fullName,
            passwordHash: hashedPassword,
            phone: invite.phone ?? undefined,
            status: "ACTIVE",
          },
        });
      } else {
        const employeeCode = createEmployeeCode();

        await tx.deliveryPartnerProfile.create({
          data: {
            email: invite.email,
            fullName: invite.fullName,
            passwordHash: hashedPassword,
            employeeCode,
            phone: invite.phone ?? undefined,
            status: "ACTIVE",
          },
        });
      }

      await tx.deliveryPartnerInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
    });

    return Response.json({ success: true, email: invite.email });
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json(
      { success: false, error: "Registration failed" },
      { status: 500 },
    );
  }
}
