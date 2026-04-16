import type { PublicRental } from "@/app/(public)/rentals/_services/getRentals";
import { getRentals } from "@/app/(public)/rentals/_services/getRentals";

export type StudioSummary = {
  providerSlug: string;
  providerName: string;
  providerPhoto: string | null;
  city: string;
  state: string;
  pincode: string;
  providerType: "BOUTIQUE" | "RENTAL" | null;
  itemCount: number;
  avgRating: number;
  reviewCount: number;
  minPrice: number;
  hasBridalFocus: boolean;
};

export type StudioFilterMode = "all" | "nearby" | "top-rated" | "bridal" | "budget";

export type StudioQuery = {
  pincode?: string;
  location?: string;
  sameDayOnly?: boolean;
};

export type StudioResult = {
  studios: StudioSummary[];
  total: number;
  matchedBy: "none" | "pincode" | "location";
};

const BRIDAL_KEYWORDS = ["bridal", "lehenga", "wedding", "shaadi", "engagement", "reception", "poshak"];

function normalizeText(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizePincode(value: string | null | undefined) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function isBridalListing(listing: PublicRental) {
  const blob = [listing.title, listing.category, listing.occasion, listing.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return BRIDAL_KEYWORDS.some((token) => blob.includes(token));
}

function buildStudioSummariesFromRentals(rentals: PublicRental[]) {
  const map = new Map<string, StudioSummary>();

  for (const item of rentals) {
    const existing = map.get(item.providerSlug);
    const itemPincode = normalizePincode(item.providerPincode);

    if (!existing) {
      map.set(item.providerSlug, {
        providerSlug: item.providerSlug,
        providerName: item.providerName,
        providerPhoto: item.providerPhoto || null,
        city: item.city,
        state: item.providerState || "",
        pincode: itemPincode,
        providerType: item.providerType ?? null,
        itemCount: 1,
        avgRating: item.rating,
        reviewCount: item.reviewCount,
        minPrice: item.price,
        hasBridalFocus: isBridalListing(item),
      });
      continue;
    }

    const totalRating = existing.avgRating * existing.itemCount + item.rating;
    existing.itemCount += 1;
    existing.avgRating = totalRating / existing.itemCount;
    existing.reviewCount += item.reviewCount;
    existing.minPrice = Math.min(existing.minPrice, item.price);
    existing.hasBridalFocus = existing.hasBridalFocus || isBridalListing(item);

    if (!existing.providerPhoto && item.providerPhoto) {
      existing.providerPhoto = item.providerPhoto;
    }

    if (!existing.state && item.providerState) {
      existing.state = item.providerState;
    }

    if (!existing.pincode && itemPincode) {
      existing.pincode = itemPincode;
    }

    map.set(item.providerSlug, existing);
  }

  return [...map.values()];
}

function sortStudios(studios: StudioSummary[]) {
  return [...studios].sort(
    (a, b) => b.avgRating - a.avgRating || b.itemCount - a.itemCount || a.minPrice - b.minPrice
  );
}

function budgetThreshold(studios: StudioSummary[]) {
  if (studios.length === 0) return 0;

  const sorted = [...studios].sort((a, b) => a.minPrice - b.minPrice);
  const at = Math.floor((sorted.length - 1) * 0.35);
  return sorted[at]?.minPrice ?? sorted[sorted.length - 1]?.minPrice ?? 0;
}

function applyModeFilter(mode: StudioFilterMode, input: StudioSummary[]) {
  const studios = [...input];

  if (mode === "top-rated") {
    return sortStudios(studios).filter((item) => item.providerType === "BOUTIQUE");
  }

  if (mode === "bridal") {
    return sortStudios(studios).filter((item) => item.hasBridalFocus);
  }

  if (mode === "budget") {
    const cap = budgetThreshold(studios);
    return sortStudios(studios).filter((item) => item.minPrice <= cap);
  }

  return sortStudios(studios);
}

function applyNearbyFilter(studios: StudioSummary[], query: StudioQuery): StudioResult {
  const pin = normalizePincode(query.pincode);
  const location = normalizeText(query.location);

  const hasPin = pin.length === 6;
  const hasLocation = location.length >= 2;

  const filtered = studios.filter((studio) => {
    const studioPin = normalizePincode(studio.pincode);
    const city = normalizeText(studio.city);
    const state = normalizeText(studio.state);

    const samePin = hasPin && studioPin === pin;
    const nearbyPin = hasPin && !samePin && studioPin.length === 6 && studioPin.slice(0, 3) === pin.slice(0, 3);
    const locationMatch = hasLocation && (city.includes(location) || state.includes(location));

    if (query.sameDayOnly) {
      return samePin;
    }

    if (hasPin || hasLocation) {
      return samePin || nearbyPin || locationMatch;
    }

    return true;
  });

  const matchedBy: "none" | "pincode" | "location" = hasPin ? "pincode" : hasLocation ? "location" : "none";

  return {
    studios: sortStudios(filtered),
    total: filtered.length,
    matchedBy,
  };
}

export async function getDesignerStudios(mode: StudioFilterMode, query: StudioQuery = {}): Promise<StudioResult> {
  const rentals = await getRentals();
  const summaries = buildStudioSummariesFromRentals(rentals);

  if (mode === "all") {
    const studios = sortStudios(summaries);
    return { studios, total: studios.length, matchedBy: "none" };
  }

  if (mode === "nearby") {
    return applyNearbyFilter(summaries, query);
  }

  const studios = applyModeFilter(mode, summaries);
  return {
    studios,
    total: studios.length,
    matchedBy: "none",
  };
}
