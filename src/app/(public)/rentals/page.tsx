import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";

import {
  RENTAL_CATEGORY_OPTIONS,
  RENTAL_CITY_OPTIONS,
  RENTAL_COLOR_OPTIONS,
  RENTAL_SIZE_OPTIONS,
  type RentalCategoryOption,
} from "@/lib/rental-listing-options";
import { STRICT_CATEGORY_MAPPING, OCCASION_COLOR_RECOMMENDATIONS } from "@/CATEGORY_FILTER_MAPPING";

import { RentalsDesktopFilterBar } from "./_components/RentalsDesktopFilterBar";
import { RentalsMobileControls } from "./_components/RentalsMobileControls";
import { getRentals } from "./_services/getRentals";
import { RentalProductCard } from "./_components/RentalProductCard";

export const metadata: Metadata = {
  title: "Browse Rentals | noorat",
  description:
    "Browse rental listings with responsive filters and category navigation from noorat.",
};

const sortOptions = ["Recommended", "What's New", "Popularity", "Price: Low to High", "Price: High to Low"];

type FilterOption = {
  label: string;
  count: number;
};

type PriceFilterOption = {
  key: string;
  label: string;
  count: number;
};

type ColorFilterOption = {
  label: string;
  count: number;
  swatchClass: string;
};

type SizeFilterOption = {
  label: string;
  count: number;
};

type SearchParamValue = string | string[] | undefined;

type PageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

const SECTION_CATEGORY_LABELS: Record<string, string[]> = {
  western: ["Western Wear", "Dresses", "Frock Dresses", "Bodycon Dresses", "Gowns", "Slit Gowns", "Cape Gowns", "Western Saree Dresses", "Maxi Dresses", "Mini Dresses", "Mermaid Gowns", "Celebrity Styles"],
  ethnic: ["Traditional Wear", "Sarees", "Lehengas", "Indo Western", "Salwar Suits", "Anarkalis", "Kurtis & Sets", "Lehenga Saree", "Heavy Gowns", "Mehndi Outfits", "Haldi Outfits", "Engagement Gowns", "Reception Gowns", "Reception Saree", "Mehndi & Haldi Outfits", "Sangeet Dresses", "Rajasthani Poshak"],
  bridal: ["Bridal Specials", "Bridal Lehengas", "Engagement Gowns", "Reception Gowns", "Reception Saree", "Mehndi & Haldi Outfits", "Sangeet Dresses", "Bridal Sarees", "Rajasthani Poshak", "Traditional Wear", "Sarees", "Lehengas", "Indo Western", "Salwar Suits", "Anarkalis", "Kurtis & Sets", "Lehenga Saree", "Heavy Gowns", "Mehndi Outfits", "Haldi Outfits"],
};

const placeholderImage = "/images/image.png";

const priceRangeConfig = [
  { key: "0-999", label: "Rs. 0 to 999", min: 0, max: 999 },
  { key: "1000-1999", label: "Rs. 1000 to 1999", min: 1000, max: 1999 },
  { key: "2000-2999", label: "Rs. 2000 to 2999", min: 2000, max: 2999 },
  { key: "3000-4999", label: "Rs. 3000 to 4999", min: 3000, max: 4999 },
  { key: "5000-plus", label: "Rs. 5000 and above", min: 5000, max: Number.POSITIVE_INFINITY },
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matchesSearchQuery(
  rental: {
    title: string;
    category: string;
    color: string;
    city: string;
    providerName: string;
    description: string;
    occasion: string;
  },
  query: string,
  isLooseMatch = false,
) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return true;
  }

  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  if (queryTokens.length === 0) {
    return true;
  }

  const haystack = normalizeText(
    [
      rental.title,
      rental.category,
      rental.color,
      rental.city,
      rental.providerName,
      rental.description,
      rental.occasion,
    ].join(" "),
  );

  const matchedTokenCount = queryTokens.reduce((count, token) => {
    return haystack.includes(token) ? count + 1 : count;
  }, 0);

  if (!isLooseMatch) {
    return matchedTokenCount === queryTokens.length;
  }

  // Loose mode: keep results broad for camera/file-name derived queries.
  const minRequired = queryTokens.length === 1 ? 1 : Math.max(1, Math.ceil(queryTokens.length / 2));
  return matchedTokenCount >= minRequired;
}

// Direct category matching using STRICT_CATEGORY_MAPPING
function getCategoryAllowedMatches(selectedLabel: string): string[] {
  return STRICT_CATEGORY_MAPPING[selectedLabel] ?? [];
}

function categoryMatches(rentalCategory: string, selectedLabel: string): boolean {
  const allowedCategories = getCategoryAllowedMatches(selectedLabel);
  return allowedCategories.some(
    (allowed) => normalizeText(rentalCategory) === normalizeText(allowed)
  );
}

function categoryMatchesSection(category: string, sectionCategories: RentalCategoryOption[]) {
  return sectionCategories.some((entry) => categoryMatches(category, entry.label));
}

function extractSizes(sizeValue: string) {
  const normalized = normalizeText(sizeValue);

  if (normalized.includes("free size")) {
    return ["Free Size"];
  }

  const rawParts = sizeValue
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const unique = Array.from(new Set(rawParts));
  return unique.length > 0 ? unique : [sizeValue.trim()];
}

function sizeMatches(listingSize: string, selectedSize: string) {
  const selected = normalizeText(selectedSize);
  const listingSizes = extractSizes(listingSize);

  // Free size listings should stay discoverable regardless of selected size.
  if (listingSizes.some((item) => normalizeText(item) === normalizeText("Free Size"))) {
    return true;
  }

  return listingSizes.some((item) => normalizeText(item) === selected);
}

const COLOR_SMART_ALIASES: Record<string, string[]> = {
  Yellow: ["haldi", "sunshine", "day wedding", "turmeric ceremony"],
  Green: ["mehndi", "henna", "garden", "day function"],
  Orange: ["haldi", "mehndi", "festive day"],
  Gold: ["wedding", "bridal", "festive", "celebration"],
  Red: ["bridal", "wedding", "ceremony", "shaadi"],
  Maroon: ["bridal", "wedding", "reception"],
  Pink: ["engagement", "day party", "bridesmaid"],
  Blue: ["cocktail", "sangeet", "evening", "afterparty"],
  Purple: ["sangeet", "cocktail", "night event"],
  Black: ["cocktail", "reception", "party", "evening glam"],
  Silver: ["reception", "cocktail", "night glam"],
  White: ["engagement", "brunch", "minimal", "day event"],
};

const SIZE_SMART_ALIASES: Record<string, string[]> = {
  XS: ["extra small", "petite", "slim fit"],
  S: ["small", "slim"],
  M: ["medium", "regular fit"],
  L: ["large", "relaxed fit"],
  XL: ["extra large", "roomy"],
  XXL: ["double xl", "plus"],
  "3XL": ["triple xl", "curve", "plus size"],
  "4XL": ["extended size", "curve", "plus size"],
  "Free Size": ["free size", "adjustable", "draped"],
};

const PRICE_SMART_ALIASES: Record<string, string[]> = {
  "0-999": ["budget", "under 1000", "affordable"],
  "1000-1999": ["budget", "daily wear", "value"],
  "2000-2999": ["mid range", "party", "event"],
  "3000-4999": ["premium", "wedding guest", "occasion"],
  "5000-plus": ["luxury", "bridal", "designer", "premium"],
};

function uniqueSearchTerms(values: Array<string | null | undefined>) {
  const entries = new Map<string, string>();

  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) {
      continue;
    }

    const normalized = normalizeText(trimmed);
    if (!normalized || entries.has(normalized)) {
      continue;
    }

    entries.set(normalized, trimmed);
  }

  return Array.from(entries.values());
}

function toArray(value: SearchParamValue) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value];
}

function parseCurrentParams(rawParams: Record<string, SearchParamValue>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(rawParams)) {
    for (const item of toArray(value)) {
      params.append(key, item);
    }
  }

  return params;
}

function buildToggleHref(currentParams: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(currentParams.toString());
  const existingValues = next.getAll(key);
  const hasValue = existingValues.some((entry) => normalizeText(entry) === normalizeText(value));

  next.delete(key);
  for (const entry of existingValues) {
    if (normalizeText(entry) !== normalizeText(value)) {
      next.append(key, entry);
    }
  }

  if (!hasValue) {
    next.append(key, value);
  }

  const query = next.toString();
  return query ? `/rentals?${query}` : "/rentals";
}

function buildSortHref(currentParams: URLSearchParams, sortValue: string) {
  const next = new URLSearchParams(currentParams.toString());
  next.set("sort", sortValue);
  const query = next.toString();
  return query ? `/rentals?${query}` : "/rentals";
}

function buildClearFilterKeyHref(currentParams: URLSearchParams, key: string) {
  const next = new URLSearchParams(currentParams.toString());
  next.delete(key);
  const query = next.toString();
  return query ? `/rentals?${query}` : "/rentals";
}

function buildClearSearchHref(currentParams: URLSearchParams) {
  const next = new URLSearchParams(currentParams.toString());
  next.delete("q");
  next.delete("match");
  next.delete("source");
  const query = next.toString();
  return query ? `/rentals?${query}` : "/rentals";
}

function buildCurrentRentalsHref(currentParams: URLSearchParams) {
  const query = currentParams.toString();
  return query ? `/rentals?${query}` : "/rentals";
}

function getCategoryHref(categoryLabel: string, categories: RentalCategoryOption[]) {
  const match = categories.find((entry) => categoryMatches(categoryLabel, entry.label));
  return match?.href ?? "/rentals";
}

function resolvePriceRange(priceKey: string) {
  const normalizedKey = normalizeText(priceKey);
  return priceRangeConfig.find((range) => normalizeText(range.key) === normalizedKey);
}

function formatCompact(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
}

function toTimestamp(value: Date | string | number | null | undefined): number {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getColorSwatchClass(color: string) {
  const swatches: Record<string, string> = {
    "Multi Color": "bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500",
    Red: "bg-red-500",
    Pink: "bg-pink-400",
    "Light Pink": "bg-pink-200 border border-border",
    "Hot Pink": "bg-pink-500",
    "Rose Pink": "bg-rose-400",
    Blue: "bg-blue-500",
    "Sky Blue": "bg-sky-300",
    "Light Blue": "bg-blue-200 border border-border",
    "Royal Blue": "bg-blue-700",
    "Powder Blue": "bg-sky-200 border border-border",
    Green: "bg-emerald-500",
    "Light Green": "bg-green-200 border border-border",
    "Sea Green": "bg-emerald-600",
    "Lime Green": "bg-lime-500",
    "Forest Green": "bg-green-800",
    Yellow: "bg-yellow-400",
    "Light Yellow": "bg-yellow-200 border border-border",
    "Lemon Yellow": "bg-yellow-300 border border-border",
    Black: "bg-slate-900",
    Maroon: "bg-red-900",
    Gold: "bg-yellow-700",
    Silver: "bg-gray-400",
    White: "bg-background border border-border",
    Purple: "bg-violet-500",
    "Light Purple": "bg-violet-200 border border-border",
    Lilac: "bg-purple-200 border border-border",
    Orange: "bg-orange-500",
    "Burnt Orange": "bg-orange-700",
    Brown: "bg-amber-900",
    "Dark Brown": "bg-stone-800",
    "Coffee Brown": "bg-amber-800",
    "Chocolate Brown": "bg-amber-950",
    Tan: "bg-amber-300 border border-border",
    Camel: "bg-amber-400",
    Beige: "bg-amber-100 border border-border",
    Cream: "bg-amber-50 border border-border",
    Ivory: "bg-stone-100 border border-border",
    Grey: "bg-neutral-400",
    "Light Grey": "bg-neutral-200 border border-border",
    Charcoal: "bg-zinc-700",
    Navy: "bg-blue-900",
    Teal: "bg-teal-500",
    Turquoise: "bg-cyan-400",
    Aqua: "bg-cyan-300",
    Cyan: "bg-cyan-500",
    Mint: "bg-emerald-300",
    Olive: "bg-lime-700",
    Peach: "bg-orange-200 border border-border",
    "Light Peach": "bg-orange-100 border border-border",
    Coral: "bg-rose-400",
    Lavender: "bg-purple-300",
    Magenta: "bg-fuchsia-600",
    Mustard: "bg-amber-500",
    Rust: "bg-orange-700",
    Wine: "bg-rose-900",
    Burgundy: "bg-red-950",
    Plum: "bg-purple-800",
    Mauve: "bg-rose-300 border border-border",
    Periwinkle: "bg-indigo-200 border border-border",
    Champagne: "bg-yellow-100 border border-border",
    "Rose Gold": "bg-rose-300",
    Copper: "bg-orange-800",
    "Off White": "bg-neutral-50 border border-border",
    Nude: "bg-orange-100 border border-border",
    Khaki: "bg-lime-300 border border-border",
    Emerald: "bg-emerald-700",
    "Sage Green": "bg-green-300 border border-border",
    "Mint Green": "bg-emerald-200 border border-border",
    "Pastel Pink": "bg-pink-100 border border-border",
    "Pastel Blue": "bg-sky-100 border border-border",
    "Pastel Green": "bg-green-100 border border-border",
    "Pastel Yellow": "bg-yellow-100 border border-border",
  };

  return swatches[color] ?? swatches["Multi Color"];
}

function FilterContent({
  categories,
  boutiques,
  cities,
  sizes,
  priceRanges,
  colors,
  selectedCategories,
  selectedBoutiques,
  selectedCities,
  selectedSizes,
  selectedPrices,
  selectedColors,
  currentParams,
}: {
  categories: FilterOption[];
  boutiques: Array<{ label: string; count: number }>;
  cities: FilterOption[];
  sizes: SizeFilterOption[];
  priceRanges: PriceFilterOption[];
  colors: ColorFilterOption[];
  selectedCategories: string[];
  selectedBoutiques: string[];
  selectedCities: string[];
  selectedSizes: string[];
  selectedPrices: string[];
  selectedColors: string[];
  currentParams: URLSearchParams;
}) {
  const categoryVisibleItems = categories;
  const boutiqueVisibleItems = boutiques;
  const cityVisibleItems = cities;
  const sizeVisibleItems = sizes;
  const priceVisibleItems = priceRanges;
  const colorVisibleItems = colors;

  return (
    <>
      <div className="border-b border-border px-4 py-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-foreground">Filters</h2>
          <Link href="/rentals" className="text-xs font-semibold uppercase tracking-wide text-foreground">
            Clear all
          </Link>
        </div>
      </div>

      <div id="filters-category" className="relative border-b border-border px-4 py-4 scroll-mt-28">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Categories</h3>
        </div>
        <div className="space-y-2.5">
          {categoryVisibleItems.map((category) => (
            <div key={category.label} className="flex items-center justify-between gap-2 text-sm text-foreground/80">
              <Link href={buildToggleHref(currentParams, "category", category.label)} className="flex items-center gap-2 hover:text-foreground">
                <input
                  type="checkbox"
                  readOnly
                  checked={selectedCategories.some((entry) => normalizeText(entry) === normalizeText(category.label))}
                  className="pointer-events-none h-4 w-4 rounded border-input"
                />
                <span className="line-clamp-1">{category.label}</span>
              </Link>
              <span className="shrink-0 text-xs text-muted-foreground">({category.count})</span>
            </div>
          ))}
        </div>
      </div>

      <div id="filters-boutique" className="relative border-b border-border px-4 py-4 scroll-mt-28">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Designer Studios</h3>
        </div>
        <div className="space-y-2.5">
          {boutiqueVisibleItems.map((boutique) => (
            <div key={boutique.label} className="flex items-center justify-between gap-2 text-sm text-foreground/80">
              <Link href={buildToggleHref(currentParams, "boutique", boutique.label)} className="flex items-center gap-2 hover:text-foreground">
                <input
                  type="checkbox"
                  readOnly
                  checked={selectedBoutiques.some((entry) => normalizeText(entry) === normalizeText(boutique.label))}
                  className="pointer-events-none h-4 w-4 rounded border-input"
                />
                <span className="line-clamp-1">{boutique.label}</span>
              </Link>
              <span className="shrink-0 text-xs text-muted-foreground">({boutique.count})</span>
            </div>
          ))}
        </div>
      </div>

      <div id="filters-size" className="relative border-b border-border px-4 py-4 scroll-mt-28">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Size</h3>
        </div>
        <div className="space-y-2.5">
          {sizeVisibleItems.map((size) => (
            <div key={size.label} className="flex items-center justify-between gap-2 text-sm text-foreground/80">
              <Link href={buildToggleHref(currentParams, "size", size.label)} className="flex items-center gap-2 hover:text-foreground">
                <input
                  type="checkbox"
                  readOnly
                  checked={selectedSizes.some((entry) => normalizeText(entry) === normalizeText(size.label))}
                  className="pointer-events-none h-4 w-4 rounded border-input"
                />
                {size.label}
              </Link>
              <span className="shrink-0 text-xs text-muted-foreground">({size.count})</span>
            </div>
          ))}
        </div>
      </div>

      <div id="filters-city" className="relative border-b border-border px-4 py-4 scroll-mt-28">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">City</h3>
        </div>
        <div className="space-y-2.5">
          {cityVisibleItems.map((city) => (
            <div key={city.label} className="flex items-center justify-between gap-2 text-sm text-foreground/80">
              <Link href={buildToggleHref(currentParams, "city", city.label)} className="flex items-center gap-2 hover:text-foreground">
                <input
                  type="checkbox"
                  readOnly
                  checked={selectedCities.some((entry) => normalizeText(entry) === normalizeText(city.label))}
                  className="pointer-events-none h-4 w-4 rounded border-input"
                />
                <span className="line-clamp-1">{city.label}</span>
              </Link>
              <span className="shrink-0 text-xs text-muted-foreground">({city.count})</span>
            </div>
          ))}
        </div>
      </div>

      <div id="filters-price" className="relative border-b border-border px-4 py-4 scroll-mt-28">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Price</h3>
        </div>
        <div className="space-y-2.5">
          {priceVisibleItems.map((range) => (
            <div key={range.key} className="flex items-center justify-between gap-2 text-sm text-foreground/80">
              <Link href={buildToggleHref(currentParams, "price", range.key)} className="flex items-center gap-2 hover:text-foreground">
                <input
                  type="checkbox"
                  readOnly
                  checked={selectedPrices.some((entry) => normalizeText(entry) === normalizeText(range.key))}
                  className="pointer-events-none h-4 w-4 rounded border-input"
                />
                {range.label}
              </Link>
              <span className="shrink-0 text-xs text-muted-foreground">({range.count})</span>
            </div>
          ))}
        </div>
      </div>

      <div id="filters-color" className="relative px-4 py-4 scroll-mt-28">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Color</h3>
        </div>
        <div className="space-y-2.5">
          {colorVisibleItems.map((color) => (
            <div key={color.label} className="flex items-center justify-between gap-2 text-sm text-foreground/80">
              <Link href={buildToggleHref(currentParams, "color", color.label)} className="flex items-center gap-2 hover:text-foreground">
                <input
                  type="checkbox"
                  readOnly
                  checked={selectedColors.some((entry) => normalizeText(entry) === normalizeText(color.label))}
                  className="pointer-events-none h-4 w-4 rounded border-input"
                />
                <span className={`h-4 w-4 rounded-full ${color.swatchClass}`} />
                {color.label}
              </Link>
              <span className="shrink-0 text-xs text-muted-foreground">({color.count})</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default async function RentalsPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const currentParams = parseCurrentParams(rawParams);

  const selectedCategories = toArray(rawParams.category);
  const selectedBoutiques = toArray(rawParams.boutique);
  const selectedColors = toArray(rawParams.color);
  const selectedCities = toArray(rawParams.city);
  const selectedSizes = toArray(rawParams.size);
  const selectedPrices = toArray(rawParams.price);
  const selectedSort = toArray(rawParams.sort)[0] || sortOptions[0];
  const selectedSection = toArray(rawParams.section)[0]?.toLowerCase();
  const selectedQuery = toArray(rawParams.q)[0] ?? "";
  const selectedMatchMode = (toArray(rawParams.match)[0] ?? "").toLowerCase();
  const currentParamEntriesWithoutSort = Array.from(currentParams.entries()).filter(([key]) => key !== "sort");

  const rentals = await getRentals();
  const configuredCategories = selectedSection && SECTION_CATEGORY_LABELS[selectedSection]
    ? RENTAL_CATEGORY_OPTIONS.filter((entry) =>
        SECTION_CATEGORY_LABELS[selectedSection].some(
          (label) => normalizeText(label) === normalizeText(entry.label),
        ),
      )
    : RENTAL_CATEGORY_OPTIONS;

  const sectionScopedRentals =
    selectedSection && configuredCategories.length > 0
      ? rentals.filter((rental) =>
          categoryMatchesSection(rental.category, configuredCategories),
        )
      : rentals;

  const categoryFilters: FilterOption[] = configuredCategories.map((entry) => ({
    label: entry.label,
    count: sectionScopedRentals.filter((rental) => categoryMatches(rental.category, entry.label)).length,
  }));

  const boutiqueMap = new Map<string, number>();
  for (const rental of sectionScopedRentals) {
    const key = rental.providerName || "noorat Partner";
    boutiqueMap.set(key, (boutiqueMap.get(key) ?? 0) + 1);
  }

  const boutiqueFilters = Array.from(boutiqueMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const cityMap = new Map<string, { label: string; count: number }>();
  for (const rental of sectionScopedRentals) {
    const city = rental.city?.trim() || "India";
    const cityKey = normalizeText(city);
    const existing = cityMap.get(cityKey);

    if (existing) {
      existing.count += 1;
    } else {
      cityMap.set(cityKey, { label: city, count: 1 });
    }
  }

  const cityFilters: FilterOption[] = [
    ...RENTAL_CITY_OPTIONS.map((label) => ({
      label,
      count: cityMap.get(normalizeText(label))?.count ?? 0,
    })),
    ...Array.from(cityMap.entries())
      .filter(([normalizedLabel]) => !RENTAL_CITY_OPTIONS.some((city) => normalizeText(city) === normalizedLabel))
      .map(([, value]) => ({
        label: value.label,
        count: value.count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];

  const sizeMap = new Map<string, number>();
  for (const rental of sectionScopedRentals) {
    for (const size of extractSizes(rental.size)) {
      sizeMap.set(size, (sizeMap.get(size) ?? 0) + 1);
    }
  }

  const sizeFilters: SizeFilterOption[] = [
    ...RENTAL_SIZE_OPTIONS.map((label) => ({
      label,
      count: sizeMap.get(label) ?? 0,
    })),
    ...Array.from(sizeMap.entries())
      .filter(([label]) => !RENTAL_SIZE_OPTIONS.some((size) => normalizeText(size) === normalizeText(label)))
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];

  const priceRanges: PriceFilterOption[] = priceRangeConfig.map((range) => ({
    key: range.key,
    label: range.label,
    count: sectionScopedRentals.filter((item) => item.price >= range.min && item.price <= range.max).length,
  }));

  const colorMap = new Map<string, { label: string; count: number }>();
  for (const rental of sectionScopedRentals) {
    const rawColor = rental.color?.trim() || "Multi Color";
    const color = normalizeText(rawColor) === "assorted" ? "Multi Color" : rawColor;
    const colorKey = normalizeText(color);
    const existing = colorMap.get(colorKey);

    if (existing) {
      existing.count += 1;
    } else {
      colorMap.set(colorKey, { label: color, count: 1 });
    }
  }

  const colors: ColorFilterOption[] = [
    ...RENTAL_COLOR_OPTIONS.map((label) => ({
      label,
      count: colorMap.get(normalizeText(label))?.count ?? 0,
      swatchClass: getColorSwatchClass(label),
    }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    ...Array.from(colorMap.entries())
      .filter(([normalizedLabel]) => !RENTAL_COLOR_OPTIONS.some((color) => normalizeText(color) === normalizedLabel))
      .map(([, value]) => ({
        label: value.label,
        count: value.count,
        swatchClass: getColorSwatchClass(value.label),
      }))
      .sort((a, b) => b.count - a.count),
  ];

  // Occasion OR-colors: when a Mehndi/Haldi category is selected,
  // listings can pass by matching the category label OR by matching occasion-appropriate colors
  const occasionAutoColors: string[] = Array.from(
    new Set(selectedCategories.flatMap((cat) => OCCASION_COLOR_RECOMMENDATIONS[cat] ?? [])),
  );

  const filteredRentals = sectionScopedRentals
    .filter((rental) => {
      if (selectedQuery && !matchesSearchQuery(rental, selectedQuery, selectedMatchMode === "loose")) {
        return false;
      }

      if (selectedCategories.length > 0) {
        const matchesCategory = selectedCategories.some((entry) => categoryMatches(rental.category, entry));
        // For occasion categories (Mehndi/Haldi), also accept listings whose color fits the occasion
        const matchesOccasionColor =
          occasionAutoColors.length > 0 &&
          occasionAutoColors.some(
            (color) => normalizeText(color) === normalizeText(rental.color || "Multi Color"),
          );
        if (!matchesCategory && !matchesOccasionColor) {
          return false;
        }
      }

      if (
        selectedBoutiques.length > 0 &&
        !selectedBoutiques.some((entry) => normalizeText(entry) === normalizeText(rental.providerName))
      ) {
        return false;
      }

      if (
        selectedCities.length > 0 &&
        !selectedCities.some((entry) => normalizeText(entry) === normalizeText(rental.city || "India"))
      ) {
        return false;
      }

      if (
        selectedColors.length > 0 &&
        !selectedColors.some((entry) => normalizeText(entry) === normalizeText(rental.color || "Multi Color"))
      ) {
        return false;
      }

      if (
        selectedSizes.length > 0 &&
        !selectedSizes.some((entry) => sizeMatches(rental.size, entry))
      ) {
        return false;
      }

      if (selectedPrices.length > 0) {
        const matchesPrice = selectedPrices.some((priceKey) => {
          const config = resolvePriceRange(priceKey);
          if (!config) return false;
          return rental.price >= config.min && rental.price <= config.max;
        });
        if (!matchesPrice) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (selectedSort === "What's New") {
        return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
      }
      if (selectedSort === "Popularity") {
        return b.reviewCount - a.reviewCount;
      }
      if (selectedSort === "Recommended") {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        if (b.reviewCount !== a.reviewCount) {
          return b.reviewCount - a.reviewCount;
        }
        return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
      }
      if (selectedSort === "Price: Low to High") {
        return a.price - b.price;
      }
      if (selectedSort === "Price: High to Low") {
        return b.price - a.price;
      }
      return 0;
    });

  const categoriesForUI = categoryFilters;

  const mobileSelectedFilterChips = [
    ...(selectedQuery ? [selectedQuery] : []),
    ...selectedCategories.map((value) => {
      const matched = categoriesForUI.find((item) => normalizeText(item.label) === normalizeText(value));
      return matched?.label ?? value;
    }),
    ...selectedBoutiques.map((value) => {
      const matched = boutiqueFilters.find((item) => normalizeText(item.label) === normalizeText(value));
      return matched?.label ?? value;
    }),
    ...selectedCities.map((value) => {
      const matched = cityFilters.find((item) => normalizeText(item.label) === normalizeText(value));
      return matched?.label ?? value;
    }),
    ...selectedSizes.map((value) => {
      const matched = sizeFilters.find((item) => normalizeText(item.label) === normalizeText(value));
      return matched?.label ?? value;
    }),
    ...selectedPrices.map((value) => {
      const matched = priceRanges.find((item) => normalizeText(item.key) === normalizeText(value));
      return matched?.label ?? value;
    }),
    ...selectedColors.map((value) => {
      const matched = colors.find((item) => normalizeText(item.label) === normalizeText(value));
      return matched?.label ?? value;
    }),
  ];

  const uniqueMobileSelectedFilterChips = Array.from(
    new Map(mobileSelectedFilterChips.map((label) => [normalizeText(label), label])).values(),
  );

  const rentalsHeading = selectedQuery ? selectedQuery : "All Rentals";

  const categoryMenuItems = categoriesForUI.map((category) => {
    const configuredCategory = configuredCategories.find((entry) => normalizeText(entry.label) === normalizeText(category.label));

    return {
      key: category.label,
      label: category.label,
      count: category.count,
      href: buildToggleHref(currentParams, "category", category.label),
      selected: selectedCategories.some((entry) => normalizeText(entry) === normalizeText(category.label)),
      searchTerms: uniqueSearchTerms([
        category.label,
        ...(configuredCategory?.aliases ?? []),
      ]),
    };
  });

  const boutiqueMenuItems = boutiqueFilters.map((boutique) => {
    return {
      key: boutique.label,
      label: boutique.label,
      count: boutique.count,
      href: buildToggleHref(currentParams, "boutique", boutique.label),
      selected: selectedBoutiques.some((entry) => normalizeText(entry) === normalizeText(boutique.label)),
      searchTerms: uniqueSearchTerms([boutique.label]),
    };
  });

  const sizeMenuItems = sizeFilters.map((size) => {
    return {
      key: size.label,
      label: size.label,
      count: size.count,
      href: buildToggleHref(currentParams, "size", size.label),
      selected: selectedSizes.some((entry) => normalizeText(entry) === normalizeText(size.label)),
      searchTerms: uniqueSearchTerms([
        size.label,
        ...(SIZE_SMART_ALIASES[size.label] ?? []),
      ]),
    };
  });

  const cityMenuItems = cityFilters.map((city) => {
    return {
      key: city.label,
      label: city.label,
      count: city.count,
      href: buildToggleHref(currentParams, "city", city.label),
      selected: selectedCities.some((entry) => normalizeText(entry) === normalizeText(city.label)),
      searchTerms: uniqueSearchTerms([city.label]),
    };
  });

  const priceMenuItems = priceRanges.map((range) => {
    return {
      key: range.key,
      label: range.label,
      count: range.count,
      href: buildToggleHref(currentParams, "price", range.key),
      selected: selectedPrices.some((entry) => normalizeText(entry) === normalizeText(range.key)),
      searchTerms: uniqueSearchTerms([
        range.label,
        ...(PRICE_SMART_ALIASES[range.key] ?? []),
      ]),
    };
  });

  const colorMenuItems = colors.map((color) => {
    return {
      key: color.label,
      label: color.label,
      count: color.count,
      href: buildToggleHref(currentParams, "color", color.label),
      selected: selectedColors.some((entry) => normalizeText(entry) === normalizeText(color.label)),
      swatchClass: color.swatchClass,
      searchTerms: uniqueSearchTerms([
        color.label,
        ...(COLOR_SMART_ALIASES[color.label] ?? []),
      ]),
    };
  });

  const sortItems = sortOptions.map((option) => ({
    label: option,
    href: buildSortHref(currentParams, option),
    selected: selectedSort === option,
  }));

  const clearCategoryHref = buildClearFilterKeyHref(currentParams, "category");
  const clearBoutiqueHref = buildClearFilterKeyHref(currentParams, "boutique");
  const clearSizeHref = buildClearFilterKeyHref(currentParams, "size");
  const clearPriceHref = buildClearFilterKeyHref(currentParams, "price");
  const clearColorHref = buildClearFilterKeyHref(currentParams, "color");
  const clearCityHref = buildClearFilterKeyHref(currentParams, "city");
  const clearSearchHref = buildClearSearchHref(currentParams);
  const applyHref = buildCurrentRentalsHref(currentParams);

  const desktopSelectedFilterChips = [
    ...selectedCategories.map((value) => {
      const matched = categoriesForUI.find((item) => normalizeText(item.label) === normalizeText(value));
      return {
        key: `category:${normalizeText(value)}`,
        label: matched?.label ?? value,
        href: buildToggleHref(currentParams, "category", value),
      };
    }),
    ...selectedBoutiques.map((value) => {
      const matched = boutiqueFilters.find((item) => normalizeText(item.label) === normalizeText(value));
      return {
        key: `boutique:${normalizeText(value)}`,
        label: matched?.label ?? value,
        href: buildToggleHref(currentParams, "boutique", value),
      };
    }),
    ...selectedCities.map((value) => {
      const matched = cityFilters.find((item) => normalizeText(item.label) === normalizeText(value));
      return {
        key: `city:${normalizeText(value)}`,
        label: matched?.label ?? value,
        href: buildToggleHref(currentParams, "city", value),
      };
    }),
    ...selectedSizes.map((value) => {
      const matched = sizeFilters.find((item) => normalizeText(item.label) === normalizeText(value));
      return {
        key: `size:${normalizeText(value)}`,
        label: matched?.label ?? value,
        href: buildToggleHref(currentParams, "size", value),
      };
    }),
    ...selectedPrices.map((value) => {
      const matched = priceRanges.find((item) => normalizeText(item.key) === normalizeText(value));
      return {
        key: `price:${normalizeText(value)}`,
        label: matched?.label ?? value,
        href: buildToggleHref(currentParams, "price", value),
      };
    }),
    ...selectedColors.map((value) => {
      const matched = colors.find((item) => normalizeText(item.label) === normalizeText(value));
      return {
        key: `color:${normalizeText(value)}`,
        label: matched?.label ?? value,
        href: buildToggleHref(currentParams, "color", value),
      };
    }),
    ...(selectedQuery
      ? [{ key: `q:${normalizeText(selectedQuery)}`, label: `Search: ${selectedQuery}`, href: clearSearchHref }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-white text-foreground">
      <div className="mx-auto w-full px-4 sm:px-5 lg:px-20 pb-24 pt-4 lg:pb-8">
        <div className="mb-4 hidden items-center gap-2 text-xs text-muted-foreground md:flex">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link href="/rentals" className="hover:text-foreground">
            Rentals
          </Link>
        </div>

        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold sm:text-2xl">{rentalsHeading}</h1>
            <span className="text-sm text-muted-foreground">{filteredRentals.length} items</span>
          </div>
        </div>

        <div className="mb-4 border-y border-border py-2.5">
          {desktopSelectedFilterChips.length > 0 ? (
            <div className="mb-3 hidden flex-wrap items-center gap-2 lg:flex">
              {desktopSelectedFilterChips.map((chip) => (
                <Link
                  key={chip.key}
                  href={chip.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-input bg-muted/40 px-3 py-1 text-xs font-medium text-foreground/85 hover:bg-muted"
                  aria-label={`Remove ${chip.label} filter`}
                >
                  <span>{chip.label}</span>
                  <X className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          ) : null}

          <RentalsMobileControls
            selectedFilterChips={uniqueMobileSelectedFilterChips}
            currentParamEntriesWithoutSort={currentParamEntriesWithoutSort}
            selectedSort={selectedSort}
            sortOptions={sortOptions}
            sortItems={sortItems}
            clearAllHref="/rentals"
            applyHref={applyHref}
            filterSheetContent={(
              <FilterContent
                categories={categoriesForUI}
                boutiques={boutiqueFilters}
                cities={cityFilters}
                sizes={sizeFilters}
                priceRanges={priceRanges}
                colors={colors}
                selectedCategories={selectedCategories}
                selectedBoutiques={selectedBoutiques}
                selectedCities={selectedCities}
                selectedSizes={selectedSizes}
                selectedPrices={selectedPrices}
                selectedColors={selectedColors}
                currentParams={currentParams}
              />
            )}
          />

          <RentalsDesktopFilterBar
            categoryItems={categoryMenuItems}
            boutiqueItems={boutiqueMenuItems}
            sizeItems={sizeMenuItems}
            priceItems={priceMenuItems}
            colorItems={colorMenuItems}
            cityItems={cityMenuItems}
            clearCategoryHref={clearCategoryHref}
            clearBoutiqueHref={clearBoutiqueHref}
            clearSizeHref={clearSizeHref}
            clearPriceHref={clearPriceHref}
            clearColorHref={clearColorHref}
            clearCityHref={clearCityHref}
            applyHref={applyHref}
            sortItems={sortItems}
            selectedSort={selectedSort}
          />
        </div>

        <section>
          {filteredRentals.length === 0 ? (
            <div className="rounded-md border border-border bg-white p-8 text-center text-sm text-muted-foreground">
              No listings found for selected filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:gap-x-4 xl:grid-cols-4">
              {filteredRentals.map((product) => {
                const ratingValue = product.rating > 0 ? product.rating.toFixed(1) : "0.0";
                const reviewLabel = product.reviewCount > 0 ? formatCompact(product.reviewCount) : "0";

                return (
                  <RentalProductCard
                    key={product.id}
                    product={product}
                    rating={ratingValue}
                    reviews={reviewLabel}
                    placeholderImage={placeholderImage}
                  />
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
