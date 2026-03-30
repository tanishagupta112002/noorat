import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/admin-auth";
import { listDeliveryAssignmentHistory } from "@/lib/admin-assignment-history";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = prisma as any;

  const [order, history] = await Promise.all([
    db.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        quantity: true,
        total: true,
        createdAt: true,
        acceptedAt: true,
        shippedAt: true,
        deliveredToCustomerAt: true,
        pickedUpFromCustomerAt: true,
        returnedToProviderAt: true,
        completedAt: true,
        cancelledAt: true,
        deliveryName: true,
        deliveryAddressLine: true,
        deliveryCity: true,
        deliveryState: true,
        deliveryPincode: true,
        listing: { select: { title: true, category: true } },
        user: { select: { name: true, email: true, phone: true } },
        provider: {
          select: {
            businessName: true,
            phone: true,
            city: true,
            user: { select: { name: true, email: true } },
          },
        },
        deliveryTask: {
          select: {
            stage: true,
            notes: true,
            deliveryPartner: {
              select: {
                fullName: true,
                email: true,
                employeeCode: true,
                phone: true,
              },
            },
          },
        },
      },
    }),
    listDeliveryAssignmentHistory({ orderId: id, take: 20 }),
  ]);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      ...order,
      createdAt: order.createdAt?.toISOString() ?? null,
      acceptedAt: order.acceptedAt?.toISOString() ?? null,
      shippedAt: order.shippedAt?.toISOString() ?? null,
      deliveredToCustomerAt: order.deliveredToCustomerAt?.toISOString() ?? null,
      pickedUpFromCustomerAt: order.pickedUpFromCustomerAt?.toISOString() ?? null,
      returnedToProviderAt: order.returnedToProviderAt?.toISOString() ?? null,
      completedAt: order.completedAt?.toISOString() ?? null,
      cancelledAt: order.cancelledAt?.toISOString() ?? null,
    },
    history: history.map((h) => ({
      ...h,
      loggedAt: h.loggedAt.toISOString(),
    })),
  });
}
