import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user?.id) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { itemId } = await req.json();

    if (!itemId) {
      return Response.json(
        { success: false, error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Remove from wishlist
    const wishlist = await prisma.wishlist.deleteMany({
      where: {
        userId: session.user.id,
        listingId: itemId,
      },
    });

    return Response.json({ success: true, wishlist });
  } catch (error) {
    console.error("Wishlist remove error:", error);
    return Response.json(
      { success: false, error: "Failed to remove from wishlist" },
      { status: 500 }
    );
  }
}
