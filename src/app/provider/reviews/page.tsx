import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare, ShieldCheck, Star, ThumbsUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

const getProviderReviewsData = unstable_cache(
	async (providerId: string) => {
		const [completedOrders, recentOrders, totalReviews, reviewAverage, recentReviews] = await prisma.$transaction([
			prisma.order.count({
				where: {
					providerId,
					status: "COMPLETED",
				},
			}),
			prisma.order.findMany({
				where: {
					providerId,
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
			prisma.listingReview.count({
				where: {
					listing: {
						providerId,
					},
				},
			}),
			prisma.listingReview.aggregate({
				where: {
					listing: {
						providerId,
					},
				},
				_avg: { rating: true },
			}),
			prisma.listingReview.findMany({
				where: {
					listing: {
						providerId,
					},
				},
				orderBy: { createdAt: "desc" },
				take: 8,
				select: {
					id: true,
					rating: true,
					title: true,
					comment: true,
					reviewerName: true,
					createdAt: true,
					listing: {
						select: {
							title: true,
						},
					},
				},
			}),
		]);

		return {
			completedOrders,
			recentOrders,
			totalReviews,
			averageRating: Number((reviewAverage._avg.rating ?? 0).toFixed(1)),
			recentReviews,
		};
	},
	["provider-reviews-page-data"],
	{ revalidate: 20 },
);

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

	const { completedOrders, recentOrders, totalReviews, averageRating, recentReviews } = await getProviderReviewsData(providerProfile.id);
	const ratingSummary = [5, 4, 3, 2, 1].map((rating) => {
		const count = recentReviews.filter((review) => review.rating === rating).length;
		const share = recentReviews.length > 0 ? Math.round((count / recentReviews.length) * 100) : 0;
		return { rating, count, share };
	});

	return (
		<div className="space-y-6">
			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<Card className="rounded-[24px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
						<CardTitle className="text-sm font-medium">Average rating</CardTitle>
						<Star className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-semibold">{totalReviews > 0 ? averageRating : "--"}</div>
						<p className="mt-1 text-sm text-muted-foreground">Based on all reviews received on your listings</p>
					</CardContent>
				</Card>

				<Card className="rounded-[24px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
						<CardTitle className="text-sm font-medium">Total reviews</CardTitle>
						<MessageSquare className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-semibold">{totalReviews}</div>
						<p className="mt-1 text-sm text-muted-foreground">
							{totalReviews === 0 ? "No customer reviews have been posted yet" : "Customer feedback collected from your catalog"}
						</p>
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

			<section>
				<Card className="rounded-[28px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader>
						<CardTitle>Recent Reviews</CardTitle>
						<CardDescription>
							View all recent feedback in a simple list. Open any review for full details.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{recentReviews.length === 0 ? (
							<div className="rounded-3xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
								No reviews yet. Once customers leave feedback, it will appear here.
							</div>
						) : (
							recentReviews.map((review) => (
								<div key={review.id} className="rounded-3xl border border-border/70 bg-background/80 p-4">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<p className="truncate text-sm font-medium text-foreground sm:text-base">{review.listing.title}</p>
											<p className="text-xs text-muted-foreground sm:text-sm">{review.reviewerName}</p>
										</div>
										<Badge variant="outline">{review.rating}/5</Badge>
									</div>
									<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{review.comment}</p>
									<div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-2">
										<p className="text-xs uppercase tracking-wide text-muted-foreground">{formatDate(review.createdAt)}</p>
										<Link
											href={`/provider/reviews/item/${review.id}`}
											className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted/40"
										>
											View Detail
										</Link>
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
