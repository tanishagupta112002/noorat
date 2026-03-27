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

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: itemId },
    });

    if (!listing) {
      return Response.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    // Check if already in wishlist
    const existingWishlist = await prisma.wishlist.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId: itemId,
        },
      },
    });

    if (existingWishlist) {
      return Response.json(
        { success: false, error: "Already in wishlist" },
        { status: 400 }
      );
    }

    // Add to wishlist
    const wishlist = await prisma.wishlist.create({
      data: {
        userId: session.user.id,
        listingId: itemId,
      },
    });

    return Response.json({ success: true, wishlist });
  } catch (error) {
    console.error("Wishlist add error:", error);
    return Response.json(
      { success: false, error: "Failed to add to wishlist" },
      { status: 500 }
    );
  }
}
