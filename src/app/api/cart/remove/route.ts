import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const itemId = String(body?.itemId || "").trim();

    if (!itemId) {
      return Response.json({ success: false, error: "Item ID is required" }, { status: 400 });
    }

    await (prisma as any).cartItem.deleteMany({
      where: {
        userId: session.user.id,
        listingId: itemId,
      },
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false, error: "Failed to remove item from cart" }, { status: 500 });
  }
}
