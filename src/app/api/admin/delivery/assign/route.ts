import { prisma } from "@/lib/prisma";
import { requireAdminUserOrThrow } from "@/lib/admin-auth";
import { recordDeliveryAssignmentHistory } from "@/lib/admin-assignment-history";

export async function POST(req: Request) {
  try {
    const admin = await requireAdminUserOrThrow();

    const body = await req.json();
    const orderId = String(body?.orderId || "").trim();
    const deliveryPartnerId = String(body?.deliveryPartnerId || "").trim();

    if (!orderId || !deliveryPartnerId) {
      return Response.json({ success: false, error: "Order and delivery partner are required" }, { status: 400 });
    }

    const [order, deliveryPartner] = await Promise.all([
      prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          listing: {
            select: {
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          provider: {
            select: {
              id: true,
              businessName: true,
              phone: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.deliveryPartnerProfile.findUnique({
        where: { id: deliveryPartnerId },
        select: {
          id: true,
          status: true,
          fullName: true,
          email: true,
          phone: true,
        },
      }),
    ]);

    if (!order) {
      return Response.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (["PENDING", "COMPLETED", "CANCELLED"].includes(order.status)) {
      return Response.json(
        {
          success: false,
          error: "Only active orders can be assigned to delivery partners",
        },
        { status: 400 },
      );
    }

    if (!deliveryPartner || deliveryPartner.status !== "ACTIVE") {
      return Response.json({ success: false, error: "Delivery partner is not active" }, { status: 400 });
    }

    if (!order.user.phone?.trim()) {
      return Response.json(
        {
          success: false,
          error: "Customer phone is mandatory before assigning delivery",
        },
        { status: 400 },
      );
    }

    if (!deliveryPartner.phone?.trim()) {
      return Response.json(
        {
          success: false,
          error: "Delivery partner phone is mandatory before assignment",
        },
        { status: 400 },
      );
    }

    const existingTask = await prisma.deliveryTask.findUnique({
      where: { orderId },
      select: {
        deliveryPartnerId: true,
        deliveryPartner: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    await prisma.deliveryTask.upsert({
      where: { orderId },
      update: {
        deliveryPartnerId,
        stage: "ASSIGNED",
      },
      create: {
        orderId,
        deliveryPartnerId,
        stage: "ASSIGNED",
      },
    });

    const providerName =
      order.provider.businessName?.trim() ||
      order.provider.user.name?.trim() ||
      order.provider.user.email;

    await recordDeliveryAssignmentHistory({
      action: existingTask ? "REASSIGNED" : "ASSIGNED",
      orderId: order.id,
      orderStatus: order.status,
      listingTitle: order.listing.title,
      providerId: order.provider.id,
      providerName,
      customerId: order.user.id,
      customerName: order.user.name?.trim() || order.user.email,
      customerEmail: order.user.email,
      customerPhone: order.user.phone,
      providerPhone: order.provider.phone,
      previousDeliveryPartnerId: existingTask?.deliveryPartnerId || null,
      previousDeliveryPartnerName: existingTask?.deliveryPartner.fullName || null,
      previousDeliveryPartnerEmail: existingTask?.deliveryPartner.email || null,
      previousDeliveryPartnerPhone: existingTask?.deliveryPartner.phone || null,
      deliveryPartnerId: deliveryPartner.id,
      deliveryPartnerName: deliveryPartner.fullName,
      deliveryPartnerEmail: deliveryPartner.email,
      deliveryPartnerPhone: deliveryPartner.phone,
      assignedByAdminId: admin.id,
      assignedByAdminName: admin.name?.trim() || admin.email,
    });

    return Response.json({
      success: true,
      message: existingTask ? "Delivery reassigned successfully" : "Delivery assigned successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    return Response.json({ success: false, error: "Unable to assign delivery" }, { status: 500 });
  }
}
