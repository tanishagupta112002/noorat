import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { prisma } from "@/lib/prisma";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function sanitizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

async function saveReviewImage(listingId: string, image: File) {
  if (!ALLOWED_MIME_TYPES.includes(image.type)) {
    throw new Error("Only JPG, PNG, and WEBP images are allowed");
  }

  if (image.size > MAX_FILE_SIZE) {
    throw new Error("Review image must be smaller than 5MB");
  }

  const extension =
    path.extname(image.name || "").toLowerCase() ||
    ({
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    } as const)[image.type] ||
    ".bin";

  const uploadDir = path.join(process.cwd(), "public", "uploads", "reviews");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${listingId}-${Date.now()}${extension}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, Buffer.from(await image.arrayBuffer()));
  return `/uploads/reviews/${fileName}`;
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
    const image = formData.get("image");

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

    let imageUrl: string | null = null;
    if (image instanceof File && image.size > 0) {
      imageUrl = await saveReviewImage(listingId, image);
    }

    const review = await prisma.listingReview.create({
      data: {
        listingId,
        reviewerName: name,
        reviewerEmail: email,
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
