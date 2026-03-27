import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MessageSquare, ShieldCheck, Star, ThumbsUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(date);
}

export default async function ProviderReviewsPage() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session?.user?.id) {
		redirect("/auth?redirect=/provider/reviews");
	}

	const providerProfile = await prisma.providerProfile.findUnique({
		where: { userId: session.user.id },
		select: {
			id: true,
			createdAt: true,
		},
	});

	if (!providerProfile) {
		redirect("/become-a-provider/onboarding");
	}

	const [completedOrders, recentOrders] = await Promise.all([
		prisma.order.count({
			where: {
				providerId: providerProfile.id,
				status: "COMPLETED",
			},
		}),
		prisma.order.findMany({
			where: {
				providerId: providerProfile.id,
				status: "COMPLETED",
			},
			orderBy: { createdAt: "desc" },
			take: 6,
			select: {
				id: true,
				createdAt: true,
				listing: {
					select: {
						title: true,
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

	return (
		<div className="space-y-6">
			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<Card className="rounded-[24px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
						<CardTitle className="text-sm font-medium">Average rating</CardTitle>
						<Star className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-semibold">--</div>
						<p className="mt-1 text-sm text-muted-foreground">Rating data will appear after review model is connected</p>
					</CardContent>
				</Card>

				<Card className="rounded-[24px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
						<CardTitle className="text-sm font-medium">Total reviews</CardTitle>
						<MessageSquare className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-semibold">0</div>
						<p className="mt-1 text-sm text-muted-foreground">No customer reviews have been posted yet</p>
					</CardContent>
				</Card>

				<Card className="rounded-[24px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
						<CardTitle className="text-sm font-medium">Completed orders</CardTitle>
						<ThumbsUp className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-semibold">{completedOrders}</div>
						<p className="mt-1 text-sm text-muted-foreground">Potential opportunities to collect feedback</p>
					</CardContent>
				</Card>

				<Card className="rounded-[24px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
						<CardTitle className="text-sm font-medium">Provider since</CardTitle>
						<ShieldCheck className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-semibold">{formatDate(providerProfile.createdAt)}</div>
						<p className="mt-1 text-sm text-muted-foreground">Build trust by maintaining strong order quality</p>
					</CardContent>
				</Card>
			</section>

			<section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
				<Card className="rounded-[28px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader>
						<CardTitle>Review feed</CardTitle>
						<CardDescription>Customer feedback timeline for your store listings.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="rounded-3xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
							Reviews are not enabled in the data model yet. This area is ready to show comments, ratings, and your responses when review records are introduced.
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-[28px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader>
						<CardTitle>Recent fulfilled orders</CardTitle>
						<CardDescription>Customers from recent completed orders who may leave a review.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{recentOrders.length === 0 ? (
							<div className="rounded-3xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
								No completed orders yet. Once deliveries are completed, they will appear here.
							</div>
						) : (
							recentOrders.map((order) => (
								<div key={order.id} className="rounded-3xl border border-border/70 bg-background/80 p-4">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<p className="truncate font-medium text-foreground">{order.listing.title}</p>
											<p className="text-sm text-muted-foreground">{order.listing.category}</p>
										</div>
										<Badge variant="outline">Completed</Badge>
									</div>
									<p className="mt-3 text-sm text-muted-foreground">{order.user.name || order.user.email}</p>
									<p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{formatDate(order.createdAt)}</p>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
