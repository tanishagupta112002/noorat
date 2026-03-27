import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return Response.json({ success: false, isInCart: false }, { status: 401 });
    }

    const body = await req.json();
    const itemId = String(body?.itemId || "").trim();

    if (!itemId) {
      return Response.json({ success: false, error: "Item ID is required", isInCart: false }, { status: 400 });
    }

    const cartItem = await (prisma as any).cartItem.findFirst({
      where: {
        userId: session.user.id,
        listingId: itemId,
      },
      select: {
        id: true,
      },
    });

    return Response.json({ success: true, isInCart: !!cartItem });
  } catch (error) {
    console.error("[CART_CHECK]", error);
    return Response.json({ success: false, error: "Internal Server Error", isInCart: false }, { status: 500 });
  }
}
