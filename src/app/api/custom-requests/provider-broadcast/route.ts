/**
 * POST /api/custom-requests/provider-broadcast
 * Broadcasts design to relevant providers
 * Triggers provider notifications to submit bids
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ProviderBroadcastResponse } from "@/types/custom-request";

export const runtime = "nodejs";

async function notifyProviders(
  db: any,
  requestId: string,
  occasion: string,
  providerType: "custom_stitch" | "rental" | "manufacturer"
): Promise<number> {
  // Find relevant providers
  const providers = await db.providerProfile.findMany({
    where: {
      // Match based on provider type and location preferences
      // For MVP: notify all active providers
      user: { isActive: true },
    },
    take: 20, // Limit to avoid overwhelming
  });

  // Create bid records for each provider (status: pending)
  const bids = await Promise.all(
    providers.map((provider) =>
      db.customRequestProviderBid.create({
        data: {
          requestId,
          providerId: provider.id,
          providerType,
          quotedPrice: 0, // Placeholder
          timeline: "TBD",
          status: "pending",
        },
      })
    )
  );

  // TODO: Send notifications via email/SMS to providers
  // For now, just create the bid records

  return bids.length;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const db = prisma as any;
    const body = await req.json();

    const {
      requestId,
      finalDesignUrl,
      occasion,
      budget,
      urgency,
      providerType = "custom_stitch",
    }: {
      requestId: string;
      finalDesignUrl: string;
      occasion: string;
      budget?: number;
      urgency?: "normal" | "urgent";
      providerType?: "custom_stitch" | "rental" | "manufacturer";
    } = body;

    if (!requestId || !finalDesignUrl) {
      return Response.json(
        {
          success: false,
          error: "requestId and finalDesignUrl are required",
        },
        { status: 400 }
      );
    }

    // Verify request exists and user owns it
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      userId = session?.user?.id ?? null;
    } catch {
      // Allow anonymous
    }

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

    // Update request with final details
    await db.customRequest.update({
      where: { id: requestId },
      data: {
        currentPreviewUrl: finalDesignUrl,
        occasion: occasion || customRequest.occasion,
        budget: budget || customRequest.budget,
        status: "provider_assigned",
        providerType: providerType,
      },
    });

    // Broadcast to providers
    const providersNotified = await notifyProviders(
      db,
      requestId,
      occasion,
      providerType
    );

    const response: ProviderBroadcastResponse = {
      success: true,
      data: {
        broadcastId: `broadcast-${requestId}-${Date.now()}`,
        providersNotified,
        timeoutHours: 24,
      },
    };

    return Response.json(response);
  } catch (error) {
    console.error("[custom-requests/provider-broadcast] failed", error);
    return Response.json(
      {
        success: false,
        error: String(error instanceof Error ? error.message : error),
      },
      { status: 500 }
    );
  }
}
