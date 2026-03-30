import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { CircleDollarSign, Clock3, Package2, TrendingUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatCurrency(value: number) {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(value);
}

function formatDate(date: Date | string | number) {
	const normalizedDate = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(normalizedDate.getTime())) {
		return "—";
	}

	return new Intl.DateTimeFormat("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(normalizedDate);
}

function getOrderBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "COMPLETED":
			return "default";
		case "PENDING":
			return "secondary";
		case "CANCELLED":
			return "destructive";
		default:
			return "outline";
	}
}

const getProviderSellsData = unstable_cache(
	async (providerId: string) => {
		const [
			totalListings,
			activeListings,
			totalOrders,
			openOrders,
			grossValue,
			recentListings,
			recentOrders,
		] = await prisma.$transaction([
			prisma.listing.count({ where: { providerId } }),
			prisma.listing.count({ where: { providerId, status: true } }),
			prisma.order.count({ where: { providerId } }),
			prisma.order.count({
				where: {
					providerId,
					status: { in: ["PENDING", "ACCEPTED", "SHIPPED"] },
				},
			}),
			prisma.order.aggregate({
				where: {
					providerId,
					status: { not: "CANCELLED" },
				},
				_sum: { total: true },
			}),
			prisma.listing.findMany({
				where: { providerId },
				orderBy: { createdAt: "desc" },
				take: 4,
				select: {
					id: true,
					title: true,
					size: true,
					images: true,
					price: true,
					category: true,
					status: true,
					createdAt: true,
				},
			}),
			prisma.order.findMany({
				where: { providerId },
				orderBy: { createdAt: "desc" },
				take: 5,
				select: {
					id: true,
					total: true,
					status: true,
					quantity: true,
					createdAt: true,
					listing: {
						select: {
							title: true,
							size: true,
							category: true,
						},
					},
					user: {
						select: {
							name: true,
							email: true,
						},
					},
				},
			}),
		]);

		return {
			totalListings,
			activeListings,
			totalOrders,
			openOrders,
			totalValue: grossValue._sum.total ?? 0,
			recentListings,
			recentOrders,
		};
	},
	["provider-sells-page-data"],
	{ revalidate: 20 },
);

export default async function ProviderSalesPage() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session?.user?.id) {
		redirect("/auth?redirect=/provider/sales");
	}

	const providerProfile = await prisma.providerProfile.findUnique({
		where: { userId: session.user.id },
		select: { id: true },
	});

	if (!providerProfile) {
		redirect("/become-a-provider/onboarding");
	}

	const providerId = providerProfile.id;
	const {
		totalListings,
		activeListings,
		totalOrders,
		openOrders,
		totalValue,
		recentListings,
		recentOrders,
	} = await getProviderSellsData(providerId);

	return (
		<div className="space-y-6">
			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<Card className="rounded-[24px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
						<CardTitle className="text-sm font-medium">Total listings</CardTitle>
						<Package2 className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-semibold">{totalListings}</div>
						<p className="mt-1 text-sm text-muted-foreground">{activeListings} active and visible to customers</p>
					</CardContent>
				</Card>

				<Card className="rounded-[24px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
						<CardTitle className="text-sm font-medium">Open orders</CardTitle>
						<Clock3 className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-semibold">{openOrders}</div>
						<p className="mt-1 text-sm text-muted-foreground">Orders awaiting fulfilment or delivery</p>
					</CardContent>
				</Card>

				<Card className="rounded-[24px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
						<CardTitle className="text-sm font-medium">Gross order value</CardTitle>
						<CircleDollarSign className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-semibold">{formatCurrency(totalValue)}</div>
						<p className="mt-1 text-sm text-muted-foreground">All non-cancelled provider orders</p>
					</CardContent>
				</Card>

				<Card className="rounded-[24px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
						<CardTitle className="text-sm font-medium">Total orders</CardTitle>
						<TrendingUp className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-semibold">{totalOrders}</div>
						<p className="mt-1 text-sm text-muted-foreground">Customer purchases handled so far</p>
					</CardContent>
				</Card>
			</section>

			<section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
				<Card className="rounded-[28px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between gap-4">
						<div>
							<CardTitle>Recent orders</CardTitle>
							<CardDescription>Latest customer activity across your listings.</CardDescription>
						</div>
						<Button asChild variant="outline" className="rounded-full">
							<Link href="/provider/orders">See all orders</Link>
						</Button>
					</CardHeader>
					<CardContent className="space-y-4">
						{recentOrders.length === 0 ? (
							<div className="rounded-3xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
								No orders yet. Once customers start booking your listings, they will appear here.
							</div>
						) : (
							recentOrders.map((order) => (
								<div key={order.id} className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-background/80 p-4 md:flex-row md:items-center md:justify-between">
									<div className="space-y-1">
										<p className="font-medium text-foreground">{order.listing.title}</p>
										<p className="text-sm text-muted-foreground">Size {order.listing.size} · {order.listing.category}</p>
										<p className="text-sm text-muted-foreground">
											{order.user.name || order.user.email} placed {order.quantity} item{order.quantity === 1 ? "" : "s"}
										</p>
										<p className="text-xs uppercase tracking-wide text-muted-foreground">{formatDate(order.createdAt)}</p>
									</div>
									<div className="flex items-center gap-3">
										<Badge variant={getOrderBadgeVariant(order.status)}>{order.status}</Badge>
										<span className="text-sm font-semibold text-foreground">{formatCurrency(order.total)}</span>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>

				<Card className="rounded-[28px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between gap-4">
						<div>
							<CardTitle>Latest listings</CardTitle>
							<CardDescription>Most recently published catalog items.</CardDescription>
						</div>
						<Button asChild variant="outline" className="rounded-full">
							<Link href="/provider/inventory">See inventory</Link>
						</Button>
					</CardHeader>
					<CardContent className="space-y-3">
						{recentListings.length === 0 ? (
							<div className="rounded-3xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
								You have not published any listings yet.
							</div>
						) : (
							recentListings.map((listing) => (
								<div key={listing.id} className="flex items-center gap-4 rounded-3xl border border-border/70 bg-background/80 p-4">
									<div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
										{listing.images[0] ? (
											<Image
												src={listing.images[0]}
												alt={listing.title}
												fill
												className="object-cover"
												sizes="96px"
											/>
										) : (
											<div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
										)}
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="truncate font-medium text-foreground">{listing.title}</p>
												<p className="text-sm text-muted-foreground">Size {listing.size} · {listing.category}</p>
											</div>
											<Badge variant={listing.status ? "default" : "outline"}>{listing.status ? "Active" : "Paused"}</Badge>
										</div>
										<div className="mt-3 flex items-center justify-between text-sm">
											<span className="text-muted-foreground">{formatDate(listing.createdAt)}</span>
											<span className="font-semibold text-foreground">{formatCurrency(listing.price)}</span>
										</div>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
