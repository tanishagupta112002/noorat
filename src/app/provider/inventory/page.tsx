import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getListingsAvailability } from "@/lib/rental-availability";
import { InventorySummaryList } from "./_components/inventory-summary-list";

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
			size: true,
			images: true,
			category: true,
			color: true,
			originalPrice: true,
			price: true,
			status: true,
			stockQuantity: true,
			createdAt: true,
			updatedAt: true,
		},
	} as any)) as Array<{
		id: string;
		title: string;
		size: string;
		images: string[];
		category: string;
		color?: string | null;
		originalPrice: number;
		price: number;
		status: boolean;
		stockQuantity: number;
		createdAt: Date;
		updatedAt: Date;
	}>;

	// Fetch real-time availability for all listings in a single query
	const availabilityMap = await getListingsAvailability(listings.map((l) => l.id));

	const serialized = listings.map((listing) => ({
		id: listing.id,
		title: listing.title,
		size: listing.size,
		images: listing.images,
		category: listing.category,
		color: listing.color?.trim().toLowerCase() === "assorted" ? "Multi Color" : (listing.color || "Multi Color"),
		price: listing.price,
		status: listing.status,
		stockQuantity: listing.stockQuantity ?? 1,
		activeOrderCount: availabilityMap[listing.id]?.activeCount ?? 0,
		nextAvailableAt: availabilityMap[listing.id]?.nextAvailableAt?.toISOString() ?? null,
	}));

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">Inventory</h1>
					<p className="text-sm text-muted-foreground">
						View all listings. Open a listing to edit photos, price, stock, and status.
					</p>
				</div>
				<Link
					href="/provider/add-stock"
					className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
				>
					Add New Stock
				</Link>
			</div>

			<InventorySummaryList listings={serialized} />
		</div>
	);
}
