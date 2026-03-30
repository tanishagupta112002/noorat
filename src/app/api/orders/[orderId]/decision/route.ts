import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RENTAL_DAYS, RETURN_DAYS } from "@/lib/rental-helpers";

const ORDER_RESPONSE_SELECT = {
  id: true,
  status: true,
  rentalStartDate: true,
  rentalEndDate: true,
  expectedReturnDate: true,
  acceptedAt: true,
  shippedAt: true,
  pickedUpFromProviderAt: true,
  deliveredToCustomerAt: true,
  pickedUpFromCustomerAt: true,
  returnedToProviderAt: true,
  completedAt: true,
  cancelledAt: true,
  updatedAt: true,
};

function appendCancellationNote(existing: string | null | undefined, message: string) {
  if (!existing) return message;
  if (existing.includes(message)) return existing;
  return `${existing}\n${message}`;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const action = typeof body?.action === "string" ? body.action.trim().toUpperCase() : "";

  if (!["CANCEL", "ACCEPT", "DECLINE"].includes(action)) {
    return Response.json({ success: false, error: "Invalid action" }, { status: 400 });
  }

  const db = prisma as any;

  const order = await db.order.findFirst({
    where: {
      id: orderId,
      userId: session.user.id,
    },
    select: {
      id: true,
      status: true,
      deliveredToCustomerAt: true,
      cancelledAt: true,
      deliveryTask: {
        select: {
          id: true,
          stage: true,
          notes: true,
        },
      },
    },
  });

  if (!order) {
    return Response.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  const isDoorstepPending =
    order.status === "SHIPPED" &&
    !order.deliveredToCustomerAt &&
    order.deliveryTask?.stage === "DELIVERED_TO_CUSTOMER";

  if (action === "CANCEL") {
    if (order.status === "CANCELLED") {
      const current = await db.order.findUnique({
        where: { id: orderId },
        select: ORDER_RESPONSE_SELECT,
      });

      return Response.json({
        success: true,
        order: current,
        deliveryTaskStage: order.deliveryTask?.stage ?? null,
      });
    }

    if (order.deliveredToCustomerAt || ["WITH_CUSTOMER", "RETURNED", "COMPLETED"].includes(order.status)) {
      return Response.json(
        {
          success: false,
          error: "Order cannot be cancelled after delivery acceptance",
        },
        { status: 400 },
      );
    }

    const now = new Date();
    const updated = await db.$transaction(async (tx: any) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          cancelledAt: now,
        },
        select: ORDER_RESPONSE_SELECT,
      });

      let nextTaskStage: string | null = order.deliveryTask?.stage ?? null;

      if (order.deliveryTask && order.deliveryTask.stage !== "CLOSED") {
        const cancelMessage = isDoorstepPending
          ? "Cancelled by customer at doorstep."
          : "Cancelled by customer before delivery.";

        const updatedTask = await tx.deliveryTask.update({
          where: { id: order.deliveryTask.id },
          data: {
            stage: "CLOSED",
            notes: appendCancellationNote(order.deliveryTask.notes, cancelMessage),
          },
          select: {
            stage: true,
          },
        });

        nextTaskStage = updatedTask.stage;
      }

      return {
        order: updatedOrder,
        deliveryTaskStage: nextTaskStage,
      };
    });

    return Response.json({ success: true, ...updated });
  }

  if (!isDoorstepPending) {
    return Response.json(
      {
        success: false,
        error: "Customer decision is available only when rider reaches your doorstep",
      },
      { status: 400 },
    );
  }

  const now = new Date();

  if (action === "ACCEPT") {
    const rentalEndDate = new Date(now);
    rentalEndDate.setDate(rentalEndDate.getDate() + RENTAL_DAYS);

    const expectedReturnDate = new Date(rentalEndDate);
    expectedReturnDate.setDate(expectedReturnDate.getDate() + RETURN_DAYS);

    const updated = await db.order.update({
      where: { id: orderId },
      data: {
        status: "WITH_CUSTOMER",
        deliveredToCustomerAt: now,
        rentalEndDate,
        expectedReturnDate,
      },
      select: ORDER_RESPONSE_SELECT,
    });

    return Response.json({
      success: true,
      order: updated,
      deliveryTaskStage: order.deliveryTask?.stage ?? null,
    });
  }

  const declined = await db.$transaction(async (tx: any) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
      },
      select: ORDER_RESPONSE_SELECT,
    });

    let nextTaskStage: string | null = order.deliveryTask?.stage ?? null;

    if (order.deliveryTask && order.deliveryTask.stage !== "CLOSED") {
      const updatedTask = await tx.deliveryTask.update({
        where: { id: order.deliveryTask.id },
        data: {
          stage: "CLOSED",
          notes: appendCancellationNote(order.deliveryTask.notes, "Customer declined order at doorstep."),
        },
        select: {
          stage: true,
        },
      });

      nextTaskStage = updatedTask.stage;
    }

    return {
      order: updatedOrder,
      deliveryTaskStage: nextTaskStage,
    };
  });

  return Response.json({ success: true, ...declined });
}