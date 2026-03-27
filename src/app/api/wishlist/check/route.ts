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
        { success: true, inWishlist: false }
      );
    }

    const { itemId } = await req.json();

    if (!itemId) {
      return Response.json(
        { success: false, error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Check if in wishlist
    const wishlist = await prisma.wishlist.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId: itemId,
        },
      },
    });

    return Response.json({ success: true, inWishlist: !!wishlist });
  } catch (error) {
    console.error("Wishlist check error:", error);
    return Response.json(
      { success: false, error: "Failed to check wishlist" },
      { status: 500 }
    );
  }
}
