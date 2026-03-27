"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

type CreateStockResponse = {
	success: boolean;
	message?: string;
};

const stockSchema = z.object({
	title: z.string().min(2, "Title must be at least 2 characters"),
	fabric: z.string().min(2, "Fabric must be at least 2 characters"),
	description: z.string().max(2000).optional(),
	size: z.string().min(1, "Size is required"),
	originalPrice: z.coerce.number().positive("Original price must be a positive number"),
	price: z.coerce.number().positive("Price must be a positive number"),
	category: z.string().min(1, "Category is required"),
	color: z.string().min(2, "Color is required"),
}).refine((data) => data.originalPrice >= data.price, {
	message: "Original price must be greater than or equal to rental price",
	path: ["originalPrice"],
});

async function getCurrentProviderProfile() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	const profile = await prisma.providerProfile.findUnique({
		where: { userId: session.user.id },
		select: { id: true },
	});

	if (!profile) {
		throw new Error("Provider profile not found");
	}

	return profile;
}

async function saveListingImages(providerProfileId: string, images: File[]): Promise<string[]> {
	const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
	const maxSizeBytes = 5 * 1024 * 1024;

	return Promise.all(
		images.map(async (image, index) => {
			if (!allowedMimeTypes.includes(image.type)) {
				throw new Error("Only JPG, PNG, and WEBP images are allowed");
			}

			if (image.size > maxSizeBytes) {
				throw new Error("Each listing image must be smaller than 5MB");
			}

			const extByMime: Record<string, string> = {
				"image/jpeg": ".jpg",
				"image/png": ".png",
				"image/webp": ".webp",
			};
			const extension = extByMime[image.type] || ".jpg";

			const fileName = `provider-listings/${providerProfileId}-${Date.now()}-${index}${extension}`;
			const blob = await put(fileName, image, { access: "public" });
			return blob.url;
		})
	);
}

export async function createStockAction(formData: FormData): Promise<CreateStockResponse> {
	try {
		const profile = await getCurrentProviderProfile();

		const data = {
			title: formData.get("title") as string,
			fabric: formData.get("fabric") as string,
			description: (formData.get("description") as string) || "",
			size: formData.get("size") as string,
			originalPrice: formData.get("originalPrice") as string,
			price: formData.get("price") as string,
			category: formData.get("category") as string,
			color: formData.get("color") as string,
		};

		const validated = stockSchema.parse(data);
		const imageEntries = formData
			.getAll("images")
			.filter((entry): entry is File => entry instanceof File && entry.size > 0);

		if (imageEntries.length === 0) {
			return { success: false, message: "At least one listing image is required" };
		}

		const imagePaths = await saveListingImages(profile.id, imageEntries);

		await prisma.listing.create({
			data: {
				providerId: profile.id,
				title: validated.title,
				Fabric: validated.fabric,
				description: validated.description?.trim() || null,
				size: validated.size,
				originalPrice: validated.originalPrice,
				price: validated.price,
				category: validated.category,
				color: validated.color,
				images: imagePaths,
				status: true,
			},
		});

		return { success: true, message: "New stock added successfully" };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, message: error.issues[0]?.message || "Invalid listing details" };
		}

		if (error instanceof Error) {
			return { success: false, message: error.message };
		}

		return { success: false, message: "Failed to add new stock" };
	}
}