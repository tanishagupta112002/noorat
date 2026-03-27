import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getProviderId(req: Request) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id) return null;

	const profile = await prisma.providerProfile.findUnique({
		where: { userId: session.user.id },
		select: { id: true },
	});

	return profile?.id ?? null;
}

async function saveListingImages(listingId: string, images: File[]): Promise<string[]> {
	const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
	const maxSizeBytes = 5 * 1024 * 1024;
	const uploadDir = path.join(process.cwd(), "public", "uploads", "provider-listings");

	await mkdir(uploadDir, { recursive: true });

	return Promise.all(
		images.map(async (image, index) => {
			if (!allowedMimeTypes.includes(image.type)) {
				throw new Error("Only JPG, PNG, and WEBP images are allowed");
			}

			if (image.size > maxSizeBytes) {
				throw new Error("Each listing image must be smaller than 5MB");
			}

			const extension =
				path.extname(image.name || "").toLowerCase() ||
				({
					"image/jpeg": ".jpg",
					"image/png": ".png",
					"image/webp": ".webp",
				} as const)[image.type] ||
				".bin";

			const fileName = `${listingId}-${Date.now()}-${index}${extension}`;
			const filePath = path.join(uploadDir, fileName);

			await writeFile(filePath, Buffer.from(await image.arrayBuffer()));
			return `/uploads/provider-listings/${fileName}`;
		})
	);
}

export async function POST(
	req: Request,
	context: { params: Promise<{ listingId: string }> }
) {
	try {
		const providerId = await getProviderId(req);
		if (!providerId) {
			return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
		}

		const { listingId } = await context.params;
		const listing = await prisma.listing.findFirst({
			where: { id: listingId, providerId },
			select: { id: true, images: true },
		});

		if (!listing) {
			return Response.json({ success: false, error: "Listing not found" }, { status: 404 });
		}

		const formData = await req.formData();
		const imageEntries = formData
			.getAll("images")
			.filter((entry): entry is File => entry instanceof File && entry.size > 0);

		if (imageEntries.length === 0) {
			return Response.json({ success: false, error: "Select at least one image" }, { status: 400 });
		}

		const uploadedPaths = await saveListingImages(listing.id, imageEntries);
		const updated = await prisma.listing.update({
			where: { id: listing.id },
			data: { images: [...listing.images, ...uploadedPaths] },
			select: {
				id: true,
				images: true,
				updatedAt: true,
			},
		});

		return Response.json({ success: true, listing: updated });
	} catch (error) {
		if (error instanceof Error) {
			return Response.json({ success: false, error: error.message }, { status: 400 });
		}

		return Response.json({ success: false, error: "Failed to upload images" }, { status: 500 });
	}
}

export async function DELETE(
	req: Request,
	context: { params: Promise<{ listingId: string }> }
) {
	try {
		const providerId = await getProviderId(req);
		if (!providerId) {
			return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
		}

		const { listingId } = await context.params;
		const listing = await prisma.listing.findFirst({
			where: { id: listingId, providerId },
			select: { id: true, images: true },
		});

		if (!listing) {
			return Response.json({ success: false, error: "Listing not found" }, { status: 404 });
		}

		const body = await req.json();
		const { imageUrl } = body;

		if (!imageUrl) {
			return Response.json({ success: false, error: "Image URL is required" }, { status: 400 });
		}

		const updatedImages = listing.images.filter((img) => img !== imageUrl);

		if (updatedImages.length === listing.images.length) {
			return Response.json({ success: false, error: "Image not found in listing" }, { status: 404 });
		}

		const updated = await prisma.listing.update({
			where: { id: listing.id },
			data: { images: updatedImages },
			select: {
				id: true,
				images: true,
				updatedAt: true,
			},
		});

		return Response.json({ success: true, listing: updated });
	} catch (error) {
		if (error instanceof Error) {
			return Response.json({ success: false, error: error.message }, { status: 400 });
		}

		return Response.json({ success: false, error: "Failed to delete image" }, { status: 500 });
	}
}
