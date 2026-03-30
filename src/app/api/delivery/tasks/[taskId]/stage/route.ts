import { prisma } from "@/lib/prisma";
import { getCurrentDeliveryPartner } from "@/lib/delivery-auth";
import { put } from "@vercel/blob";
import {
  DELIVERY_TASK_NEXT_STAGE,
  getProofFieldForStage,
} from "@/lib/delivery-workflow";
import { RETURN_DAYS } from "@/lib/rental-helpers";
import type { DeliveryTaskStage } from "@/lib/delivery-workflow";

function getBlobTokenOrThrow(): string {
  const token =
    (typeof process.env.BLOB_READ_WRITE_TOKEN === "string" &&
      process.env.BLOB_READ_WRITE_TOKEN.trim()) ||
    (typeof process.env.VERCEL_BLOB_READ_WRITE_TOKEN === "string" &&
      process.env.VERCEL_BLOB_READ_WRITE_TOKEN.trim()) ||
    "";

  if (!token) {
    throw new Error(
      "Vercel Blob token is missing. Set BLOB_READ_WRITE_TOKEN (or VERCEL_BLOB_READ_WRITE_TOKEN).",
    );
  }

  return token;
}

async function uploadTaskProof(deliveryPartnerId: string, taskId: string, file: File): Promise<string> {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSizeBytes = 5 * 1024 * 1024;

  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error("Only JPG, PNG, and WEBP images are allowed");
  }

  if (file.size > maxSizeBytes) {
    throw new Error("Proof image must be smaller than 5MB");
  }

  const extByMime: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  const extension = extByMime[file.type] || ".jpg";
  const fileName = `delivery-proofs/task-${deliveryPartnerId}-${taskId}-${Date.now()}${extension}`;

  const blob = await put(fileName, file, {
    access: "public",
    token: getBlobTokenOrThrow(),
  });

  return blob.url;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  const db = prisma as any;
  const deliverySession = await getCurrentDeliveryPartner();

  if (!deliverySession?.deliveryPartner?.id) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (deliverySession.deliveryPartner.status !== "ACTIVE") {
    return Response.json({ success: false, error: "Delivery access denied" }, { status: 403 });
  }

  const { taskId } = await context.params;
  const contentType = req.headers.get("content-type") || "";
  let proofImageUrl = "";
  let notes = "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    notes = String(formData.get("notes") || "").trim();
    proofImageUrl = String(formData.get("proofImageUrl") || "").trim();

    const proofImage = formData.get("proofImage");
    if (proofImage instanceof File && proofImage.size > 0) {
      proofImageUrl = await uploadTaskProof(deliverySession.deliveryPartner.id, taskId, proofImage);
    }
  } else {
    const body = await req.json();
    proofImageUrl = typeof body?.proofImageUrl === "string" ? body.proofImageUrl.trim() : "";
    notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  }

  const task = await db.deliveryTask.findFirst({
    where: {
      id: taskId,
      deliveryPartnerId: deliverySession.deliveryPartner.id,
    },
    select: {
      id: true,
      stage: true,
      orderId: true,
      order: {
        select: {
          status: true,
          deliveredToCustomerAt: true,
          user: {
            select: {
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!task) {
    return Response.json({ success: false, error: "Task not found" }, { status: 404 });
  }

  const nextStage = DELIVERY_TASK_NEXT_STAGE[task.stage];
  if (!nextStage) {
    return Response.json({ success: false, error: "Task already completed" }, { status: 400 });
  }

  if (task.order.status === "CANCELLED") {
    return Response.json(
      { success: false, error: "Order is cancelled. No further delivery updates allowed" },
      { status: 400 },
    );
  }

  if (nextStage === "PICKED_UP_FROM_PROVIDER" && task.order.status !== "SHIPPED") {
    return Response.json(
      { success: false, error: "Provider dispatch pending. Ask provider to mark order as dispatched first" },
      { status: 400 },
    );
  }

  if (!deliverySession.deliveryPartner.phone?.trim()) {
    return Response.json(
      {
        success: false,
        error: "Delivery partner phone is mandatory to continue delivery timeline",
      },
      { status: 400 },
    );
  }

  if (!task.order.user.phone?.trim()) {
    return Response.json(
      {
        success: false,
        error: "Customer phone is missing. Ask admin to update customer contact first",
      },
      { status: 400 },
    );
  }

  if (nextStage === "PICKED_UP_FROM_CUSTOMER" && task.order.status !== "WITH_CUSTOMER") {
    return Response.json(
      {
        success: false,
        error:
          "Customer acceptance is pending. Ask customer to Accept or Decline from My Orders before pickup",
      },
      { status: 400 },
    );
  }

  const proofField = getProofFieldForStage(nextStage);
  if (proofField && !proofImageUrl) {
    return Response.json(
      { success: false, error: "Proof image URL is required for this step" },
      { status: 400 },
    );
  }

  const updated = await db.$transaction(async (tx: any) => {
    const updateData: {
      stage: DeliveryTaskStage;
      notes?: string;
      pickupProofImage?: string;
      deliveryProofImage?: string;
      returnPickupProofImage?: string;
      providerDropProofImage?: string;
    } = {
      stage: nextStage,
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (proofField) {
      updateData[proofField] = proofImageUrl;
    }

    const updatedTask = await tx.deliveryTask.update({
      where: { id: task.id },
      data: updateData,
      select: {
        id: true,
        stage: true,
        updatedAt: true,
      },
    });

    const orderUpdateData: {
      status?: "SHIPPED" | "RETURNED";
      pickedUpFromProviderAt?: Date;
      pickedUpFromCustomerAt?: Date;
      returnedToProviderAt?: Date;
      rentalEndDate?: Date;
      expectedReturnDate?: Date;
    } = {};

    const now = new Date();

    if (nextStage === "PICKED_UP_FROM_PROVIDER") {
      orderUpdateData.status = "SHIPPED";
      orderUpdateData.pickedUpFromProviderAt = now;
    }

    if (nextStage === "PICKED_UP_FROM_CUSTOMER") {
      orderUpdateData.pickedUpFromCustomerAt = now;
      orderUpdateData.rentalEndDate = now;

      const expectedReturnDate = new Date(now);
      expectedReturnDate.setDate(expectedReturnDate.getDate() + RETURN_DAYS);
      orderUpdateData.expectedReturnDate = expectedReturnDate;
    }

    if (nextStage === "DELIVERED_TO_PROVIDER") {
      orderUpdateData.status = "RETURNED";
      orderUpdateData.returnedToProviderAt = now;
    }

    let updatedOrder: {
      status: string;
      rentalStartDate: Date | null;
      rentalEndDate: Date | null;
      expectedReturnDate: Date | null;
      acceptedAt: Date | null;
      shippedAt: Date | null;
      pickedUpFromProviderAt: Date | null;
      deliveredToCustomerAt: Date | null;
      pickedUpFromCustomerAt: Date | null;
      returnedToProviderAt: Date | null;
      completedAt: Date | null;
      cancelledAt: Date | null;
      updatedAt: Date;
    } | null = null;

    if (Object.keys(orderUpdateData).length > 0) {
      updatedOrder = await tx.order.update({
        where: { id: task.orderId },
        data: orderUpdateData,
        select: {
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
        },
      });
    }

    return { updatedTask, updatedOrder };
  });

  return Response.json({
    success: true,
    task: updated.updatedTask,
    order: updated.updatedOrder,
  });
}
