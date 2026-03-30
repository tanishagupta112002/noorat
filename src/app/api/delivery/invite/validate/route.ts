import { prisma } from "@/lib/prisma";
import { hashInviteToken } from "@/lib/delivery-workflow";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return Response.json({ valid: false, error: "Invite token is required" }, { status: 400 });
  }

  const tokenHash = hashInviteToken(token);
  const invite = await prisma.deliveryPartnerInvite.findUnique({
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

  if (!invite) {
    return Response.json({ valid: false, error: "Invalid invite token" }, { status: 404 });
  }

  if (invite.usedAt) {
    return Response.json({ valid: false, error: "Invite already used" }, { status: 400 });
  }

  if (invite.expiresAt < new Date()) {
    return Response.json({ valid: false, error: "Invite expired" }, { status: 400 });
  }

  return Response.json({
    valid: true,
    invite: {
      email: invite.email,
      fullName: invite.fullName,
      phone: invite.phone,
      expiresAt: invite.expiresAt,
    },
  });
}
