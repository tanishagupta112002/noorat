/**
 * POST /api/custom-requests/assign-provider
 * User selects a provider, creates order
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { AssignProviderResponse } from "@/types/custom-request";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  try {
    const db = prisma as any;
    const body = await req.json();

    const {
      requestId,
      bidId,
      providerId,
    }: {
      requestId: string;
      bidId: string;
      providerId: string;
    } = body;

    if (!requestId || !bidId || !providerId) {
      return Response.json(
        {
          success: false,
          error: "requestId, bidId, and providerId are required",
        },
        { status: 400 }
      );
    }

    // Get current user
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      userId = session?.user?.id ?? null;
    } catch {
      // Allow order without auth for MVP
    }

    if (!userId) {
      return Response.json(
        { success: false, error: "Authentication required for order creation" },
        { status: 401 }
      );
    }

    // Fetch custom request
    const customRequest = await db.customRequest.findUnique({
      where: { id: requestId },
    });

    if (!customRequest) {
      return Response.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    if (customRequest.userId !== userId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Fetch and verify bid
    const bid = await db.customRequestProviderBid.findUnique({
      where: { id: bidId },
      include: { request: true },
    });

    if (!bid) {
      return Response.json(
        { success: false, error: "Bid not found" },
        { status: 404 }
      );
    }

    if (bid.providerId !== providerId) {
      return Response.json(
        { success: false, error: "Bid/provider mismatch" },
        { status: 400 }
      );
    }

    // Mark bid as selected
    await db.customRequestProviderBid.update({
      where: { id: bidId },
      data: { status: "selected" },
    });

    // Update custom request with provider assignment
    await db.customRequest.update({
      where: { id: requestId },
      data: {
        selectedProviderId: providerId,
        status: "order_created",
        providerType: bid.providerType as any,
        providerQuoteJson: JSON.stringify({
          quotedPrice: bid.quotedPrice,
          timeline: bid.timeline,
          deliveryNote: bid.deliveryNote,
          customizations: bid.customizations,
        }),
      },
    });

    // Create a mock order (future: integrate with Orders table)
    // For MVP, we're just recording the assignment

    const response: AssignProviderResponse = {
      success: true,
      data: {
        orderId: `order-${requestId}-${Date.now()}`,
        providerId,
        quotedPrice: bid.quotedPrice,
        timeline: bid.timeline,
        nextSteps: [
          "Provider will contact you shortly",
          "Confirm measurements and final details",
          "Make payment",
          "Design stitching begins",
          "Track order status",
        ],
      },
    };

    return Response.json(response);
  } catch (error) {
    console.error("[custom-requests/assign-provider] failed", error);
    return Response.json(
      {
        success: false,
        error: String(error instanceof Error ? error.message : error),
      },
      { status: 500 }
    );
  }
}
