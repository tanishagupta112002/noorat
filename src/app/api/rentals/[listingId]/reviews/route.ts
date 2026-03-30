import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function getBlobTokenOrThrow(): string {
  const token =
    (typeof process.env.BLOB_READ_WRITE_TOKEN === "string" &&
      process.env.BLOB_READ_WRITE_TOKEN.trim()) ||
    (typeof process.env.VERCEL_BLOB_READ_WRITE_TOKEN === "string" &&
      process.env.VERCEL_BLOB_READ_WRITE_TOKEN.trim()) ||
    "";

  if (!token) {
    throw new Error(
      "Vercel Blob token is missing. Set BLOB_READ_WRITE_TOKEN (or VERCEL_BLOB_READ_WRITE_TOKEN)."
    );
  }

  return token;
}

function sanitizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

async function saveReviewMedia(listingId: string, media: File) {
  if (!ALLOWED_MIME_TYPES.includes(media.type)) {
    throw new Error("Only JPG, PNG, WEBP, MP4, WEBM, and MOV files are allowed");
  }

  if (media.size > MAX_FILE_SIZE) {
    throw new Error("Review media must be smaller than 25MB");
  }

  const extByMime: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  };
  const extension = extByMime[media.type] || ".bin";

  const fileName = `reviews/${listingId}-${Date.now()}${extension}`;
  const blob = await put(fileName, media, {
    access: "public",
    token: getBlobTokenOrThrow(),
  });
  return blob.url;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  try {
    const { listingId } = await context.params;

    const reviews = await prisma.listingReview.findMany({
      where: { listingId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        listingId: true,
        reviewerName: true,
        rating: true,
        title: true,
        comment: true,
        imageUrl: true,
        createdAt: true,
      },
    });

    return Response.json({ success: true, reviews });
  } catch {
    return Response.json({ success: false, error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ success: false, error: "Please sign in to submit a review" }, { status: 401 });
    }

    const { listingId } = await context.params;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });

    if (!listing) {
      return Response.json({ success: false, error: "Listing not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const name = sanitizeName((formData.get("name") as string | null) || "");
    const email = (formData.get("email") as string | null) || null;
    const title = sanitizeName((formData.get("title") as string | null) || "");
    const comment = sanitizeName((formData.get("comment") as string | null) || "");
    const rating = Number(formData.get("rating"));
    const orderId = sanitizeName((formData.get("orderId") as string | null) || "");
    const media = formData.get("media") || formData.get("image");

    if (!orderId) {
      return Response.json(
        { success: false, error: "Delivered order is required to submit a review" },
        { status: 400 },
      );
    }

    if (!name || !comment) {
      return Response.json(
        { success: false, error: "Name and review are required" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return Response.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    const eligibleOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        listingId,
        OR: [
          {
            status: { in: ["WITH_CUSTOMER", "RETURNED", "COMPLETED"] },
          },
          {
            status: "SHIPPED",
            deliveryTask: {
              is: {
                stage: "DELIVERED_TO_CUSTOMER",
              },
            },
          },
          {
            status: "CANCELLED",
            deliveryTask: {
              is: {
                stage: "CLOSED",
                notes: {
                  contains: "Customer declined order at doorstep.",
                },
              },
            },
          },
        ],
      },
      select: { id: true, createdAt: true },
    });

    if (!eligibleOrder) {
      return Response.json(
        { success: false, error: "You can review after rider reaches your doorstep or doorstep decline" },
        { status: 403 },
      );
    }

    const normalizedEmail = (email || session.user.email || "").trim() || null;

    if (normalizedEmail) {
      const existingReview = await prisma.listingReview.findFirst({
        where: {
          listingId,
          reviewerEmail: normalizedEmail,
          createdAt: {
            gte: eligibleOrder.createdAt,
          },
        },
        select: { id: true },
      });

      if (existingReview) {
        return Response.json(
          { success: false, error: "You already submitted a review for this item" },
          { status: 409 },
        );
      }
    }

    let imageUrl: string | null = null;
    if (media instanceof File && media.size > 0) {
      imageUrl = await saveReviewMedia(listingId, media);
    }

    const review = await prisma.listingReview.create({
      data: {
        listingId,
        reviewerName: name,
        reviewerEmail: normalizedEmail,
        rating,
        title: title || null,
        comment,
        imageUrl,
      },
      select: {
        id: true,
        listingId: true,
        reviewerName: true,
        reviewerEmail: true,
        rating: true,
        title: true,
        comment: true,
        imageUrl: true,
        createdAt: true,
      },
    });

    return Response.json({ success: true, review });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ success: false, error: error.message }, { status: 400 });
    }

    return Response.json({ success: false, error: "Failed to submit review" }, { status: 500 });
  }
}
