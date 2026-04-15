/**
 * GET /api/custom-requests/provider-bids/[requestId]
 * Retrieves all provider quotes for a custom request
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ProviderBidsResponse } from "@/types/custom-request";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> }
): Promise<Response> {
  try {
    const db = prisma as any;
    const { requestId } = await params;

    if (!requestId) {
      return Response.json(
        { success: false, error: "requestId is required" },
        { status: 400 }
      );
    }

    // Verify authorization
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      userId = session?.user?.id ?? null;
    } catch {
      // Allow anonymous
    }

    // Fetch request
    const customRequest = await db.customRequest.findUnique({
      where: { id: requestId },
    });

    if (!customRequest) {
      return Response.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    if (userId && customRequest.userId !== userId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Fetch provider bids
    const bids = await db.customRequestProviderBid.findMany({
      where: { requestId },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            city: true,
            user: { select: { email: true } },
          },
        },
      },
      orderBy: [
        { status: "asc" }, // pending first
        { quotedPrice: "asc" }, // then by price
      ],
    });

    // Format response
    const formattedBids = bids.map((bid) => ({
      id: bid.id,
      providerId: bid.providerId,
      providerName: bid.provider.businessName || "Unknown Provider",
      providerType: bid.providerType as any,
      quotedPrice: bid.quotedPrice,
      timeline: bid.timeline,
      deliveryNote: bid.deliveryNote,
      customizations: bid.customizations,
      providerRating: bid.providerRating,
      completionRate: bid.completionRate,
      status: bid.status as any,
      createdAt: bid.createdAt.toISOString(),
      respondedAt: bid.respondedAt?.toISOString() || null,
    }));

    // Find best quotes by different criteria
    const bestByPrice = formattedBids
      .filter((b) => b.status === "accepted")
      .sort((a, b) => a.quotedPrice - b.quotedPrice)[0];

    const bestByRating = formattedBids
      .filter((b) => b.providerRating)
      .sort((a, b) => (b.providerRating || 0) - (a.providerRating || 0))[0];

    const response: ProviderBidsResponse = {
      success: true,
      data: {
        requestId,
        bids: formattedBids,
        bestQuote: bestByPrice,
        highestRated: bestByRating,
      },
    };

    return Response.json(response);
  } catch (error) {
    console.error("[custom-requests/provider-bids] failed", error);
    return Response.json(
      {
        success: false,
        error: String(error instanceof Error ? error.message : error),
      },
      { status: 500 }
    );
  }
}
