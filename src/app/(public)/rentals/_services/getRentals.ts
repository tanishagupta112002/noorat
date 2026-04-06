import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const listingCardSelect = {
	id: true,
	createdAt: true,
	title: true,
	category: true,
	size: true,
	originalPrice: true,
	price: true,
	color: true,
	images: true,
	description: true,
	providerId: true,
	provider: {
		select: {
			businessName: true,
			profilePhoto: true,
			shopImage: true,
			address: true,
			city: true,
			state: true,
			pincode: true,
		},
	},
} satisfies Prisma.ListingSelect;

export type PublicRental = {
	id: string;
	createdAt: Date;
	title: string;
	category: string;
	occasion: string;
	size: string;
	originalPrice: number;
	price: number;
	color: string;
	images: string[];
	providerName: string;
	providerPhoto: string | null;
	providerSlug: string;
	providerId: string;
	city: string;
	providerState: string;
	providerPincode: string;
	providerAddress: string | null;
	providerShopImage: string | null;
	description: string;
	rating: number;
	reviewCount: number;
};

export type PublicListingReview = {
	id: string;
	listingId: string;
	reviewerName: string;
	rating: number;
	title: string | null;
	comment: string;
	imageUrl: string | null;
	createdAt: Date;
};

type ListingRow = Prisma.ListingGetPayload<{ select: typeof listingCardSelect }>;
type ListingReviewStat = { rating: number; reviewCount: number };

function inferOccasionFromText(...values: Array<string | null | undefined>) {
	const normalized = values
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

	const rules = [
		{ label: "Haldi", terms: ["haldi", "turmeric"] },
		{ label: "Mehndi", terms: ["mehndi", "henna"] },
		{ label: "Sangeet", terms: ["sangeet", "afterparty", "dance night"] },
		{ label: "Reception", terms: ["reception", "reception gown"] },
		{ label: "Engagement", terms: ["engagement", "ring ceremony"] },
		{ label: "Cocktail", terms: ["cocktail", "party", "evening", "sequin"] },
		{ label: "Birthday", terms: ["birthday"] },
		{ label: "Brunch", terms: ["brunch", "daywear", "day plan"] },
		{ label: "Family Function", terms: ["family function", "festive", "traditional", "puja"] },
		{ label: "Wedding", terms: ["wedding", "bridal", "lehenga", "ceremony", "shaadi"] },
	] as const;

	for (const rule of rules) {
		if (rule.terms.some((term) => normalized.includes(term))) {
			return rule.label;
		}
	}

	return "Wedding";
}

export function slugifyProviderName(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-");
}

function toPublicRental(listing: ListingRow, stats?: ListingReviewStat): PublicRental {
	const providerName = listing.provider.businessName?.trim() || "noorat Partner";
	const description = listing.description?.trim() || "";

	return {
		id: listing.id,
		createdAt: listing.createdAt,
		title: listing.title,
		category: listing.category,
		occasion: inferOccasionFromText(listing.title, listing.category),
		size: listing.size,
		originalPrice: listing.originalPrice,
		price: listing.price,
		color: listing.color?.trim().toLowerCase() === "assorted" ? "Multi Color" : (listing.color || "Multi Color"),
		images: listing.images,
		providerName,
		providerPhoto: listing.provider.profilePhoto || null,
		providerSlug: slugifyProviderName(providerName),
		providerId: listing.providerId,
		city: listing.provider.city?.trim() || "India",
		providerAddress: listing.provider.address || null,
		providerShopImage: listing.provider.shopImage || null,
		providerState: listing.provider.state?.trim() || "",
		providerPincode: (listing.provider.pincode || "").replace(/\D/g, "").slice(0, 6),
		description,
		rating: stats?.rating ?? 0,
		reviewCount: stats?.reviewCount ?? 0,
	};
}

async function getListingReviewStats(listingIds: string[]): Promise<Map<string, ListingReviewStat>> {
	if (listingIds.length === 0) return new Map();

	const rows = await prisma.listingReview.groupBy({
		by: ["listingId"],
		where: { listingId: { in: listingIds } },
		_avg: { rating: true },
		_count: { id: true },
	});

	return new Map(
		rows.map((row) => [
			row.listingId,
			{
				rating: Number((row._avg.rating ?? 0).toFixed(1)),
				reviewCount: row._count.id,
			},
		]),
	);
}

async function fetchListingRows(limit: number | undefined = 120, where: Prisma.ListingWhereInput = { status: true }) {
	return prisma.listing.findMany({
		orderBy: { createdAt: "desc" },
		take: typeof limit === "number" ? limit : undefined,
		where,
		select: listingCardSelect,
	});
}

const getRentalsCached = unstable_cache(async (): Promise<PublicRental[]> => {
	try {
		const listings = await fetchListingRows(undefined);
		const statsMap = await getListingReviewStats(listings.map((listing) => listing.id));
		return listings.map((listing) => toPublicRental(listing, statsMap.get(listing.id)));
	} catch {
		return [];
	}
}, ["public-rentals:list"], {
	revalidate: 120,
	tags: ["public-rentals"],
});

export async function getRentals(): Promise<PublicRental[]> {
	return getRentalsCached();
}

const getRentalByIdCached = unstable_cache(async (id: string): Promise<PublicRental | null> => {
	try {
		const [listing, reviewStat] = await Promise.all([
			prisma.listing.findFirst({
			where: { id, status: true },
			select: listingCardSelect,
			}),
			prisma.listingReview.aggregate({
				where: { listingId: id },
				_avg: { rating: true },
				_count: { id: true },
			}),
		]);

		if (!listing) return null;
		return toPublicRental(listing, {
			rating: Number((reviewStat._avg.rating ?? 0).toFixed(1)),
			reviewCount: reviewStat._count.id,
		});
	} catch {
		return null;
	}
}, ["public-rentals:by-id"], {
	revalidate: 120,
	tags: ["public-rentals"],
});

export async function getRentalById(id: string): Promise<PublicRental | null> {
	return getRentalByIdCached(id);
}

const getSimilarRentalsCached = unstable_cache(async (
	listingId: string,
	category: string,
	limit: number,
): Promise<PublicRental[]> => {
	try {
		const rows = await fetchListingRows(Math.max(limit * 3, 12), {
			status: true,
			id: { not: listingId },
		});
		const statsMap = await getListingReviewStats(rows.map((listing) => listing.id));

		return rows
			.sort((left, right) => {
				const leftScore = left.category === category ? 1 : 0;
				const rightScore = right.category === category ? 1 : 0;

				if (leftScore !== rightScore) {
					return rightScore - leftScore;
				}

				return 0;
			})
			.slice(0, limit)
			.map((listing) => toPublicRental(listing, statsMap.get(listing.id)));
	} catch {
		return [];
	}
}, ["public-rentals:similar"], {
	revalidate: 120,
	tags: ["public-rentals"],
});

export async function getSimilarRentals(listingId: string, category: string, limit = 4): Promise<PublicRental[]> {
	return getSimilarRentalsCached(listingId, category, limit);
}

export async function getRentalsByProviderSlug(providerSlug: string): Promise<PublicRental[]> {
	const rentals = await getRentals();
	return rentals.filter((rental) => rental.providerSlug === providerSlug);
}

const getProviderListingCountCached = unstable_cache(async (providerId: string): Promise<number> => {
	if (!providerId) return 0;

	try {
		return await prisma.listing.count({
			where: {
				providerId,
				status: true,
			},
		});
	} catch {
		return 0;
	}
}, ["public-rentals:provider-count"], {
	revalidate: 300,
	tags: ["public-rentals"],
});

export async function getProviderListingCount(providerId: string): Promise<number> {
	return getProviderListingCountCached(providerId);
}

const getListingReviewsCached = unstable_cache(async (listingId: string): Promise<PublicListingReview[]> => {
	try {
		return await prisma.listingReview.findMany({
			where: { listingId },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				listingId: true,
				reviewerName: true,
				rating: true,
				title: true,
				comment: true,
				imageUrl: true,
				createdAt: true,
			},
		});
	} catch {
		return [];
	}
}, ["public-rentals:reviews"], {
	revalidate: 60,
	tags: ["public-rentals-reviews"],
});

export async function getListingReviews(listingId: string): Promise<PublicListingReview[]> {
	return getListingReviewsCached(listingId);
}
