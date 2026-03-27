import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const listingUpdateSchema = z.object({
	title: z.string().min(2).max(140),
	fabric: z.string().min(2).max(200),
	description: z.string().max(2000).optional(),
	size: z.string().min(1).max(40),
	category: z.string().min(1).max(100),
	color: z.string().min(2).max(50),
	originalPrice: z.coerce.number().positive(),
	price: z.coerce.number().positive(),
	status: z.boolean(),
}).refine((data) => data.originalPrice >= data.price, {
	message: "Original price must be greater than or equal to rental price",
	path: ["originalPrice"],
});

async function getProviderId(req: Request) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id) return null;

	const profile = await prisma.providerProfile.findUnique({
		where: { userId: session.user.id },
		select: { id: true },
	});

	return profile?.id ?? null;
}

export async function PATCH(
	req: Request,
	context: { params: Promise<{ listingId: string }> }
) {
	const providerId = await getProviderId(req);
	if (!providerId) {
		return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
	}

	const { listingId } = await context.params;
	const payload = await req.json();
	const parsed = listingUpdateSchema.safeParse(payload);

	if (!parsed.success) {
		return Response.json(
			{ success: false, error: parsed.error.issues[0]?.message || "Invalid listing data" },
			{ status: 400 }
		);
	}

	const listing = await prisma.listing.findFirst({
		where: { id: listingId, providerId },
		select: { id: true },
	});

	if (!listing) {
		return Response.json({ success: false, error: "Listing not found" }, { status: 404 });
	}

	const updated = await prisma.listing.update({
		where: { id: listingId },
		data: {
			title: parsed.data.title,
			Fabric: parsed.data.fabric,
			description: parsed.data.description?.trim() || null,
			size: parsed.data.size,
			category: parsed.data.category,
			color: parsed.data.color,
			originalPrice: parsed.data.originalPrice,
			price: parsed.data.price,
			status: parsed.data.status,
		} as any,
		select: {
			id: true,
			title: true,
			Fabric: true,
			description: true,
			size: true,
			category: true,
			color: true,
			originalPrice: true,
			price: true,
			status: true,
			images: true,
			createdAt: true,
			updatedAt: true,
		} as any,
	});

	return Response.json({ success: true, listing: updated });
}

export async function DELETE(
	req: Request,
	context: { params: Promise<{ listingId: string }> }
) {
	const providerId = await getProviderId(req);
	if (!providerId) {
		return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
	}

	const { listingId } = await context.params;
	const listing = await prisma.listing.findFirst({
		where: { id: listingId, providerId },
		select: { id: true },
	});

	if (!listing) {
		return Response.json({ success: false, error: "Listing not found" }, { status: 404 });
	}

	await prisma.listing.delete({ where: { id: listingId } });

	return Response.json({ success: true });
}
