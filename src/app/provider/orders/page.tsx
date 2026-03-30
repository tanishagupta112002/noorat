import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getListingsAvailability } from "@/lib/rental-availability";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdersSummaryList } from "./_components/orders-summary-list";

export default async function ProviderOrdersPage() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session?.user?.id) {
		redirect("/auth?redirect=/provider/orders");
	}

	const providerProfile = await prisma.providerProfile.findUnique({
		where: { userId: session.user.id },
		select: { id: true },
	});

	if (!providerProfile) {
		redirect("/become-a-provider/onboarding");
	}

	const db = prisma as any;

	const orders = (await db.order.findMany({
		where: { providerId: providerProfile.id },
		orderBy: { createdAt: "desc" },
		take: 50,
		select: {
			id: true,
			quantity: true,
			total: true,
			status: true,
			deliveryTask: {
				select: {
					stage: true,
				},
			},
			deliveryName: true,
			deliveryAddressLine: true,
			deliveryCity: true,
			deliveryState: true,
			deliveryPincode: true,
			createdAt: true,
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
			listing: {
				select: {
					id: true,
					title: true,
					size: true,
					category: true,
					images: true,
					stockQuantity: true,
				},
			},
			user: {
				select: {
					name: true,
					email: true,
					phone: true,
				},
			},
		},
	})) as any[];

	const listingIds: string[] = Array.from(new Set(orders.map((o) => String(o.listing.id))));
	const availabilityMap = await getListingsAvailability(listingIds);

	// Serialize dates to ISO strings so they can pass client-component boundary
	const serialized = orders.map((o) => ({
		id: o.id,
		quantity: o.quantity,
		total: o.total,
		status: o.status,
		deliveryTaskStage: o.deliveryTask?.stage ?? null,
		deliveryName: o.deliveryName,
		deliveryAddressLine: o.deliveryAddressLine,
		deliveryCity: o.deliveryCity,
		deliveryState: o.deliveryState,
		deliveryPincode: o.deliveryPincode,
		createdAt: o.createdAt.toISOString(),
		rentalStartDate: o.rentalStartDate?.toISOString() ?? null,
		rentalEndDate: o.rentalEndDate?.toISOString() ?? null,
		expectedReturnDate: o.expectedReturnDate?.toISOString() ?? null,
		acceptedAt: o.acceptedAt?.toISOString() ?? null,
		shippedAt: o.shippedAt?.toISOString() ?? null,
		pickedUpFromProviderAt: o.pickedUpFromProviderAt?.toISOString() ?? null,
		deliveredToCustomerAt: o.deliveredToCustomerAt?.toISOString() ?? null,
		pickedUpFromCustomerAt: o.pickedUpFromCustomerAt?.toISOString() ?? null,
		returnedToProviderAt: o.returnedToProviderAt?.toISOString() ?? null,
		completedAt: o.completedAt?.toISOString() ?? null,
		cancelledAt: o.cancelledAt?.toISOString() ?? null,
		listing: o.listing,
		user: o.user,
		availability: {
			activeCount: availabilityMap[o.listing.id]?.activeCount ?? 0,
			nextAvailableAt: availabilityMap[o.listing.id]?.nextAvailableAt?.toISOString() ?? null,
		},
	}));

	return (
		<Card className="rounded-[28px] border-border/70 bg-white/70 shadow-sm">
			<CardHeader>
				<CardTitle>Orders</CardTitle>
				<CardDescription>
					See all incoming orders in one place. Open any order to view full timeline,
					customer details, availability, and status actions.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<OrdersSummaryList orders={serialized} />
			</CardContent>
		</Card>
	);
}

