import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InventoryManager } from "./_components/inventory-manager";

export default async function ProviderInventoryPage() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session?.user?.id) {
		redirect("/auth?redirect=/provider/inventory");
	}

	const providerProfile = await prisma.providerProfile.findUnique({
		where: { userId: session.user.id },
		select: { id: true },
	});

	if (!providerProfile) {
		redirect("/become-a-provider/onboarding");
	}

	const listings = (await prisma.listing.findMany({
		where: { providerId: providerProfile.id },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			title: true,
			Fabric: true,
			size: true,
			images: true,
			category: true,
			color: true,
			originalPrice: true,
			price: true,
			status: true,
			createdAt: true,
			updatedAt: true,
		},
	} as any)) as Array<{
		id: string;
		title: string;
		Fabric: string;
		size: string;
		images: string[];
		category: string;
		color?: string | null;
		originalPrice: number;
		price: number;
		status: boolean;
		createdAt: Date;
		updatedAt: Date;
	}>;

	return (
		<InventoryManager
			initialListings={listings.map((listing) => ({
				id: listing.id,
				title: listing.title,
				fabric: listing.Fabric,
				size: listing.size,
				images: listing.images,
				category: listing.category,
				color: listing.color || "Assorted",
				originalPrice: listing.originalPrice,
				price: listing.price,
				status: listing.status,
				createdAt: listing.createdAt.toISOString(),
				updatedAt: listing.updatedAt.toISOString(),
			}))}
		/>
	);
}
