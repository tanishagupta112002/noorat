import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { ArrowRightLeft, BadgeIndianRupee, ReceiptText, Wallet } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
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

const getProviderPaymentsData = unstable_cache(
	async (providerId: string) => {
		const [grossValue, paidOrdersCount, cancelledOrdersCount, recentTransactions] = await prisma.$transaction([
			prisma.order.aggregate({
				where: {
					providerId,
					status: { not: "CANCELLED" },
				},
				_sum: { total: true },
			}),
			prisma.order.count({
				where: {
					providerId,
					status: "COMPLETED",
				},
			}),
			prisma.order.count({
				where: {
					providerId,
					status: "CANCELLED",
				},
			}),
			prisma.order.findMany({
				where: {
					providerId,
					status: { not: "CANCELLED" },
				},
				orderBy: { createdAt: "desc" },
				take: 8,
				select: {
					id: true,
					total: true,
					status: true,
					createdAt: true,
					listing: {
						select: {
							title: true,
							size: true,
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
			grossSales: grossValue._sum.total ?? 0,
			paidOrdersCount,
			cancelledOrdersCount,
			recentTransactions,
		};
	},
	["provider-payments-page-data"],
	{ revalidate: 20 },
);

export default async function ProviderPaymentsPage() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session?.user?.id) {
		redirect("/auth?redirect=/provider/payments");
	}

	const providerProfile = await prisma.providerProfile.findUnique({
		where: { userId: session.user.id },
		select: { id: true },
	});

	if (!providerProfile) {
		redirect("/become-a-provider/onboarding");
	}

	const providerId = providerProfile.id;
	const { grossSales, paidOrdersCount, cancelledOrdersCount, recentTransactions } = await getProviderPaymentsData(providerId);
	const estimatedPayout = grossSales * 0.9;

	return (
		<div className="space-y-6">
			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<Card className="rounded-[24px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
						<CardTitle className="text-sm font-medium">Gross sales</CardTitle>
						<BadgeIndianRupee className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-semibold">{formatCurrency(grossSales)}</div>
						<p className="mt-1 text-sm text-muted-foreground">All successful and in-progress orders</p>
					</CardContent>
				</Card>

				<Card className="rounded-[24px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
						<CardTitle className="text-sm font-medium">Estimated payout</CardTitle>
						<Wallet className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-semibold">{formatCurrency(estimatedPayout)}</div>
						<p className="mt-1 text-sm text-muted-foreground">After applying a 10% platform fee estimate</p>
					</CardContent>
				</Card>

				<Card className="rounded-[24px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
						<CardTitle className="text-sm font-medium">Completed orders</CardTitle>
						<ReceiptText className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-semibold">{paidOrdersCount}</div>
						<p className="mt-1 text-sm text-muted-foreground">Orders that reached completed status</p>
					</CardContent>
				</Card>

				<Card className="rounded-[24px] border-border/70 bg-white/70 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
						<CardTitle className="text-sm font-medium">Cancelled orders</CardTitle>
						<ArrowRightLeft className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-semibold">{cancelledOrdersCount}</div>
						<p className="mt-1 text-sm text-muted-foreground">Orders excluded from payout calculations</p>
					</CardContent>
				</Card>
			</section>

			<Card className="rounded-[28px] border-border/70 bg-white/70 shadow-sm">
				<CardHeader>
					<CardTitle>Recent transactions</CardTitle>
					<CardDescription>Most recent order amounts contributing to your payouts.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{recentTransactions.length === 0 ? (
						<div className="rounded-3xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
							No payment records yet. Transaction rows will appear here once orders are placed.
						</div>
					) : (
						recentTransactions.map((txn) => (
							<div key={txn.id} className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-background/80 p-4 md:flex-row md:items-center md:justify-between">
								<div className="space-y-1">
									<p className="font-medium text-foreground">{txn.listing.title}</p>
									<p className="text-sm text-muted-foreground">Size {txn.listing.size} · {txn.user.name || txn.user.email}</p>
									<p className="text-xs uppercase tracking-wide text-muted-foreground">{formatDate(txn.createdAt)}</p>
								</div>
								<div className="flex items-center gap-3">
									<Badge variant={getOrderBadgeVariant(txn.status)}>{txn.status}</Badge>
									<span className="text-sm font-semibold text-foreground">{formatCurrency(txn.total)}</span>
								</div>
							</div>
						))
					)}
				</CardContent>
			</Card>
		</div>
	);
}
