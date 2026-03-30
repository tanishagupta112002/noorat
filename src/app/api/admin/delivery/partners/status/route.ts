import { prisma } from "@/lib/prisma";
import { requireAdminUserOrThrow } from "@/lib/admin-auth";

export async function PATCH(req: Request) {
  try {
    await requireAdminUserOrThrow();

    const body = await req.json();
    const deliveryPartnerId = String(body?.deliveryPartnerId || "").trim();
    const parsedStatus = String(body?.status || "").trim().toUpperCase();
    const isValidStatus = parsedStatus === "ACTIVE" || parsedStatus === "SUSPENDED";

    if (!deliveryPartnerId || !isValidStatus) {
      return Response.json(
        {
          success: false,
          error: "Delivery partner id and valid status are required",
        },
        { status: 400 },
      );
    }

    const nextStatus: "ACTIVE" | "SUSPENDED" = parsedStatus;

    const updated = await prisma.deliveryPartnerProfile.updateMany({
      where: { id: deliveryPartnerId },
      data: {
        status: nextStatus,
      },
    });

    if (updated.count === 0) {
      return Response.json({ success: false, error: "Delivery partner not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: `Delivery partner ${nextStatus === "ACTIVE" ? "activated" : "suspended"} successfully`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return Response.json({ success: false, error: "Unable to update delivery partner status" }, { status: 500 });
  }
}
