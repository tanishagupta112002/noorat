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
    const requestedQty = Number(body?.quantity ?? 1);
    const quantity = Number.isFinite(requestedQty) ? Math.max(1, Math.trunc(requestedQty)) : 1;

    if (!itemId) {
      return Response.json({ success: false, error: "Item ID is required" }, { status: 400 });
    }

    const listing = await prisma.listing.findFirst({
      where: { id: itemId, status: true },
      select: { id: true },
    });

    if (!listing) {
      return Response.json({ success: false, error: "Listing not found" }, { status: 404 });
    }

    const cartItem = await (prisma as any).cartItem.upsert({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId: itemId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        userId: session.user.id,
        listingId: itemId,
        quantity,
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    return Response.json({ success: true, cartItem });
  } catch {
    return Response.json({ success: false, error: "Failed to add item to cart" }, { status: 500 });
  }
}
