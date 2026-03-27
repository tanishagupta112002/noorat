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
    const quantityRaw = Number(body?.quantity);

    if (!itemId || !Number.isFinite(quantityRaw)) {
      return Response.json({ success: false, error: "Item ID and quantity are required" }, { status: 400 });
    }

    const quantity = Math.trunc(quantityRaw);

    if (quantity <= 0) {
      await (prisma as any).cartItem.deleteMany({
        where: {
          userId: session.user.id,
          listingId: itemId,
        },
      });

      return Response.json({ success: true, removed: true });
    }

    const updated = await (prisma as any).cartItem.updateMany({
      where: {
        userId: session.user.id,
        listingId: itemId,
      },
      data: {
        quantity,
      },
    });

    if (updated.count === 0) {
      return Response.json({ success: false, error: "Cart item not found" }, { status: 404 });
    }

    return Response.json({ success: true, quantity });
  } catch {
    return Response.json({ success: false, error: "Failed to update cart item" }, { status: 500 });
  }
}
