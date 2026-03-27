import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatCurrency(value: number) {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(value);
}

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(date);
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

	const orders = await prisma.order.findMany({
		where: { providerId: providerProfile.id },
		orderBy: { createdAt: "desc" },
		take: 20,
		select: {
			id: true,
			quantity: true,
			total: true,
			status: true,
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
	});

	return (
		<Card className="rounded-[28px] border-border/70 bg-white/70 shadow-sm">
			<CardHeader>
				<CardTitle>Orders</CardTitle>
				<CardDescription>Latest provider orders with customer and listing details.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{orders.length === 0 ? (
					<div className="rounded-3xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
						No orders yet. Once shoppers book your items, they will appear here.
					</div>
				) : (
					orders.map((order) => (
						<div key={order.id} className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-background/80 p-4 md:flex-row md:items-center md:justify-between">
							<div className="space-y-1">
								<p className="font-medium text-foreground">{order.listing.title}</p>
								<p className="text-sm text-muted-foreground">Size {order.listing.size} · {order.listing.category}</p>
								<p className="text-sm text-muted-foreground">
									{order.user.name || order.user.email} · {order.quantity} item{order.quantity === 1 ? "" : "s"}
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
	);
}
