import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

/** Valid provider-driven status transitions */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["SHIPPED", "CANCELLED"],
  RETURNED: ["COMPLETED"],
};

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

async function uploadDispatchProof(providerId: string, orderId: string, file: File): Promise<string> {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSizeBytes = 5 * 1024 * 1024;

  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error("Only JPG, PNG, and WEBP images are allowed");
  }

  if (file.size > maxSizeBytes) {
    throw new Error("Dispatch proof image must be smaller than 5MB");
  }

  const extByMime: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  const extension = extByMime[file.type] || ".jpg";
  const fileName = `delivery-proofs/provider-dispatch-${providerId}-${orderId}-${Date.now()}${extension}`;

  const blob = await put(fileName, file, {
    access: "public",
    token: getBlobTokenOrThrow(),
  });

  return blob.url;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const db = prisma as any;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await context.params;

  const providerProfile = await db.providerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!providerProfile) {
    return Response.json({ success: false, error: "Provider profile not found" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") || "";
  let newStatus = "";
  let dispatchProofImageUrl = "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    newStatus = String(formData.get("status") || "").trim().toUpperCase();
    dispatchProofImageUrl = String(formData.get("proofImageUrl") || "").trim();

    const proofImage = formData.get("proofImage");
    if (proofImage instanceof File && proofImage.size > 0) {
      dispatchProofImageUrl = await uploadDispatchProof(providerProfile.id, orderId, proofImage);
    }
  } else {
    const body = await req.json();
    newStatus = typeof body?.status === "string" ? body.status.trim().toUpperCase() : "";
    dispatchProofImageUrl =
      typeof body?.proofImageUrl === "string" ? body.proofImageUrl.trim() : "";
  }

  const order = await db.order.findFirst({
    where: { id: orderId, providerId: providerProfile.id },
    select: { id: true, status: true, rentalStartDate: true, acceptedAt: true },
  });

  if (!order) {
    return Response.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  if (order.status === newStatus) {
    const current = await db.order.findUnique({
      where: { id: orderId },
      select: ORDER_RESPONSE_SELECT,
    });

    return Response.json({ success: true, order: current });
  }

  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return Response.json(
      { success: false, error: `Cannot move from ${order.status} to ${newStatus}` },
      { status: 400 },
    );
  }

  if (newStatus === "SHIPPED") {
    if (!dispatchProofImageUrl) {
      return Response.json(
        { success: false, error: "Dispatch proof image is required" },
        { status: 400 },
      );
    }

    const existingTask = await db.deliveryTask.findUnique({
      where: { orderId },
      select: { id: true, stage: true },
    });

    if (!existingTask) {
      return Response.json(
        { success: false, error: "Assign this order to a delivery partner first" },
        { status: 400 },
      );
    }
  }

  const updated = await db.$transaction(async (tx: any) => {
    const orderUpdateData: any = {
      status: newStatus,
    };
    const now = new Date();

    if (newStatus === "ACCEPTED") {
      orderUpdateData.acceptedAt = now;
    }

    if (newStatus === "SHIPPED") {
      orderUpdateData.shippedAt = now;
      if (!order.acceptedAt) {
        orderUpdateData.acceptedAt = now;
      }
    }

    if (newStatus === "CANCELLED") {
      orderUpdateData.cancelledAt = now;
    }

    if (newStatus === "COMPLETED") {
      orderUpdateData.completedAt = now;
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: orderUpdateData,
      select: ORDER_RESPONSE_SELECT,
    });

    if (newStatus === "SHIPPED") {
      await tx.deliveryTask.update({
        where: { orderId },
        data: {
          pickupProofImage: dispatchProofImageUrl,
        },
      });
    }

    return updatedOrder;
  });

  return Response.json({ success: true, order: updated });
}
