import { prisma } from "@/lib/prisma";

export type PublicRental = {
	id: string;
	title: string;
	category: string;
	occasion: string;
	size: string;
	fabric: string;
	originalPrice: number;
	price: number;
	color: string;
	images: string[];
	providerName: string;
	providerPhoto: string | null;
	providerSlug: string;
	providerId: string;
	city: string;
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

type ListingRow = {
	id: string;
	title: string;
	category: string;
	size: string;
	price: number;
	originalPrice: number;
	color?: string | null;
	images: string[];
	Fabric: string;
	description?: string | null;
	providerId: string;
	provider: {
		businessName?: string | null;
		profilePhoto?: string | null;
		city?: string | null;
	};
	reviews: Array<{ rating: number }>;
};

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

function averageRating(reviews: Array<{ rating: number }>) {
	if (reviews.length === 0) return 0;
	const total = reviews.reduce((sum, review) => sum + review.rating, 0);
	return Number((total / reviews.length).toFixed(1));
}

function toPublicRental(listing: ListingRow): PublicRental {
	const providerName = listing.provider.businessName?.trim() || "TaniTwirl Partner";
	const fabric = listing.Fabric?.trim() || "Not specified";
	const description = listing.description?.trim() || "";

	return {
		id: listing.id,
		title: listing.title,
		category: listing.category,
		occasion: inferOccasionFromText(listing.title, listing.category, listing.Fabric),
		size: listing.size,
		fabric,
		originalPrice: listing.originalPrice,
		price: listing.price,
		color: listing.color || "Assorted",
		images: listing.images,
		providerName,
		providerPhoto: listing.provider.profilePhoto || null,
		providerSlug: slugifyProviderName(providerName),
		providerId: listing.providerId,
		city: listing.provider.city?.trim() || "India",
		description,
		rating: averageRating(listing.reviews),
		reviewCount: listing.reviews.length,
	};
}

async function fetchListingRows(limit = 120) {
	try {
		const listings = (await prisma.listing.findMany({
			orderBy: { createdAt: "desc" },
			take: limit,
			where: { status: true },
			select: {
				id: true,
				title: true,
				category: true,
				size: true,
				originalPrice: true,
				price: true,
				color: true,
				images: true,
				Fabric: true,
				description: true,
				providerId: true,
				provider: {
					select: {
						businessName: true,
						profilePhoto: true,
						city: true,
					},
				},
				reviews: {
					select: { rating: true },
				},
			},
		}) as unknown) as ListingRow[];

		return listings;
	} catch {
		const listings = (await prisma.listing.findMany({
			orderBy: { createdAt: "desc" },
			take: limit,
			where: { status: true },
			select: {
				id: true,
				title: true,
				category: true,
				size: true,
				originalPrice: true,
				price: true,
				color: true,
				images: true,
				Fabric: true,
				description: true,
				providerId: true,
				provider: {
					select: {
						businessName: true,
						profilePhoto: true,
						city: true,
					},
				},
			},
		}) as unknown) as Array<Omit<ListingRow, "reviews">>;

		return listings.map((listing) => ({ ...listing, reviews: [] }));
	}
}

export async function getRentals(): Promise<PublicRental[]> {
	try {
		const listings = await fetchListingRows();
		return listings.map(toPublicRental);
	} catch {
		return [];
	}
}

export async function getRentalById(id: string): Promise<PublicRental | null> {
	try {
		try {
			const listing = (await prisma.listing.findFirst({
				where: { id, status: true },
				select: {
					id: true,
					title: true,
					category: true,
					size: true,
					originalPrice: true,
					price: true,
					color: true,
					images: true,
					Fabric: true,
					description: true,
					providerId: true,
					provider: {
						select: {
							businessName: true,
							profilePhoto: true,
							city: true,
						},
					},
					reviews: {
						select: { rating: true },
					},
				},
			}) as unknown) as ListingRow | null;

			if (!listing) return null;
			return toPublicRental(listing);
		} catch {
			const listing = await prisma.listing.findFirst({
				where: { id, status: true },
				select: {
					id: true,
					title: true,
					category: true,
					size: true,
					originalPrice: true,
					price: true,
					color: true,
					images: true,
					Fabric: true,
					description: true,
					providerId: true,
					provider: {
						select: {
							businessName: true,
							profilePhoto: true,
							city: true,
						},
					},
				},
			});

			if (!listing) return null;
			return toPublicRental({ ...(listing as Omit<ListingRow, "reviews">), reviews: [] });
		}
	} catch {
		return null;
	}
}

export async function getSimilarRentals(listingId: string, category: string, limit = 4): Promise<PublicRental[]> {
	try {
		const categoryListings = await fetchListingRows(limit + 20).then((rows) =>
			rows
				.filter((row) => row.id !== listingId && row.category === category)
				.slice(0, limit),
		);

		if (categoryListings.length >= limit) {
			return categoryListings.map(toPublicRental);
		}

		const needed = limit - categoryListings.length;
		const extraListings = await fetchListingRows(80).then((rows) =>
			rows
				.filter((row) => row.id !== listingId && !categoryListings.some((item) => item.id === row.id))
				.slice(0, needed),
		);

		return [...categoryListings, ...extraListings].map(toPublicRental);
	} catch {
		return [];
	}
}

export async function getRentalsByProviderSlug(providerSlug: string): Promise<PublicRental[]> {
	const rentals = await getRentals();
	return rentals.filter((rental) => rental.providerSlug === providerSlug);
}

export async function getListingReviews(listingId: string): Promise<PublicListingReview[]> {
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
}
