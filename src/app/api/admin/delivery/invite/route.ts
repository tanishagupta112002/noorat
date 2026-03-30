import { prisma } from "@/lib/prisma";
import { createInviteToken, hashInviteToken } from "@/lib/delivery-workflow";
import { requireAdminUserOrThrow } from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const admin = await requireAdminUserOrThrow();
    const body = await req.json();

    const fullName = String(body?.fullName || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const phone = String(body?.phone || "").trim();

    if (!fullName || !email || !phone) {
      return Response.json(
        { success: false, error: "Full name, email, and phone are required" },
        { status: 400 },
      );
    }

    const alreadyRegistered = await prisma.deliveryPartnerProfile.findUnique({
      where: { email },
      select: { id: true },
    });

    if (alreadyRegistered) {
      return Response.json(
        { success: false, error: "This email is already registered for delivery agent" },
        { status: 400 },
      );
    }

    const now = new Date();
    const existingPendingInvite = await prisma.deliveryPartnerInvite.findFirst({
      where: {
        email,
        usedAt: null,
        expiresAt: { gt: now },
      },
      select: { id: true },
    });

    if (existingPendingInvite) {
      return Response.json({ success: false, error: "Active invite already exists for this email" }, { status: 400 });
    }

    let rawToken = "";
    let tokenHash = "";
    let uniqueCodeFound = false;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      rawToken = createInviteToken();
      tokenHash = hashInviteToken(rawToken);

      const existing = await prisma.deliveryPartnerInvite.findUnique({
        where: { tokenHash },
        select: { id: true },
      });

      if (!existing) {
        uniqueCodeFound = true;
        break;
      }
    }

    if (!uniqueCodeFound) {
      return Response.json({ success: false, error: "Could not generate unique invite code" }, { status: 500 });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      const created = await tx.deliveryPartnerInvite.create({
        data: {
          fullName,
          email,
          phone: phone || null,
          tokenHash,
          expiresAt,
          createdByAdminId: admin.id,
        },
        select: { id: true },
      });

      await tx.verification.create({
        data: {
          identifier: `delivery_invite:${created.id}`,
          value: rawToken,
          expiresAt,
        },
      });
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    return Response.json({ success: false, error: "Unable to create invite" }, { status: 500 });
  }
}
