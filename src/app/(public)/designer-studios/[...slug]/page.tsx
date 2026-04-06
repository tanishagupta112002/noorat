import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, BadgeCheck, MapPin, Star, Zap } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDesignerStudios,
  type StudioFilterMode,
  type StudioQuery,
} from "@/app/(public)/designer-studios/_services/studio-discovery";
import { NearbySearchForm } from "@/app/(public)/designer-studios/_components/nearby-search-form";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type SubpageConfig = {
  mode: StudioFilterMode;
  title: string;
  description: string;
  badge?: string;
};

const SUBPAGE_CONFIG: Record<string, SubpageConfig> = {
  nearby: {
    mode: "nearby",
    title: "Nearby Designer Studios",
    description:
      "Hyperlocal search with pin code or city so users can quickly find nearby rentals and same-day eligible studios.",
    badge: "Hyperlocal",
  },
  "top-rated": {
    mode: "top-rated",
    title: "Top Rated Boutiques",
    description: "Studios ranked by strongest ratings and customer review volume.",
    badge: "Popular",
  },
  bridal: {
    mode: "bridal",
    title: "Bridal Rental Specialists",
    description: "Studios focused on bridal lehengas, wedding events, and ceremony styling.",
  },
  budget: {
    mode: "budget",
    title: "Budget Friendly Rentals",
    description: "Affordable boutiques with strong value pricing for rental outfits.",
  },
};

function parseQuery(raw: Record<string, string | string[] | undefined>): StudioQuery {
  const pick = (value: string | string[] | undefined) => {
    if (Array.isArray(value)) return value[0] || "";
    return value || "";
  };

  return {
    pincode: pick(raw.pincode).replace(/\D/g, "").slice(0, 6),
    location: pick(raw.location).trim(),
    sameDayOnly: pick(raw.sameDay) === "1",
  };
}

function getConfigFromSlug(slug?: string[]) {
  if (!slug || slug.length === 0) {
    return null;
  }

  const key = slug.join("/").toLowerCase();
  return SUBPAGE_CONFIG[key] ?? null;
}

function toSlugRoot(slug?: string[]) {
  if (!slug || slug.length === 0) return "/designer-studios";
  return `/designer-studios/${slug.join("/")}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getConfigFromSlug(slug);

  if (!config) {
    return { title: "Designer Studios | noorat" };
  }

  return {
    title: `${config.title} | noorat`,
    description: config.description,
  };
}

export default async function DesignerStudiosSlugPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const config = getConfigFromSlug(slug);

  if (!config) {
    notFound();
  }

  // Keep canonical hierarchy under /designer-studios and normalize accidental nested nearby paths.
  if (slug && slug.length > 1 && slug[0]?.toLowerCase() === "nearby") {
    permanentRedirect(`/designer-studios/${slug[1]}`);
  }

  const query = parseQuery(await searchParams);
  const result = await getDesignerStudios(config.mode, query);

  const isNearbyMode = config.mode === "nearby";
  const hasSelectedLocation = Boolean(query.location);

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* ── Nearby page: keep hero always visible ─────────────────────────────── */}
      {isNearbyMode ? (
        <div 
          className="relative w-full min-h-[72vh] flex flex-col items-center justify-start px-4 pt-24 sm:pt-28 overflow-hidden"
          style={{
            backgroundImage: `
              linear-gradient(rgba(9, 10, 14, 0.72), rgba(9, 10, 14, 0.72)),
              linear-gradient(to bottom, rgba(0, 0, 0, 0.58) 0%, rgba(0, 0, 0, 0.2) 24%, rgba(0, 0, 0, 0.2) 76%, rgba(0, 0, 0, 0.58) 100%),
              url('/images/city.png')
            `,
            backgroundSize: "cover, cover, 100% 100%",
            backgroundPosition: "center, center, center bottom",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Decorative dots pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{ 
              backgroundImage: "radial-gradient(circle, var(--primary) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }}
          />
          
          <div className="relative z-10 w-full max-w-3xl">
            <NearbySearchForm variant="hero" selectedCityName={query.location || undefined} />
          </div>
        </div>
      ) : (
        /* ── Normal state: Studios list ──────────────────────────────────────────── */
        <div className="mx-auto w-full px-4 sm:px-5 lg:px-20 pb-16 pt-4">
          <div className="mb-4 border-y border-border py-2.5">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="/designer-studios">
                  View All Designer Studios
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {null}

          {result.total > 0 ? (
            <>
              <p className="mb-5 mt-4 text-sm text-muted-foreground">{result.total} studios found</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.studios.map((studio) => (
                  <Card key={studio.providerSlug} className="rounded-2xl border-border/70 bg-white/80">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-9 w-9 border border-border/70">
                          <AvatarImage src={studio.providerPhoto || undefined} alt={studio.providerName} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {studio.providerName.charAt(0).toUpperCase() || "S"}
                          </AvatarFallback>
                        </Avatar>
                        <CardTitle className="line-clamp-1 text-lg">{studio.providerName}</CardTitle>
                        <BadgeCheck className="h-4 w-4 text-blue-500" />
                        {config.mode === "nearby" && (
                          <Badge className="ml-auto gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <Zap className="h-3 w-3 fill-emerald-700" />
                            24hr Delivery
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {studio.city}
                          {studio.pincode ? `, ${studio.pincode}` : ""}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {studio.avgRating.toFixed(1)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {studio.itemCount} listed items · {studio.reviewCount} reviews · from Rs. {Math.round(studio.minPrice)}
                      </p>
                      <Button asChild className="w-full justify-between">
                        <Link href={`/designer-studios/provider-profile/${studio.providerSlug}`}>
                          Open Studio Profile
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="mb-6 rounded-2xl border-dashed border-border/80 bg-muted/20">
              <CardContent className="py-6 text-sm text-muted-foreground">
                No nearby studios found for this location yet. Try another city or pin code, or switch off same-day only.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Nearby selected city content (below hero) ─────────────────────────── */}
      {isNearbyMode && hasSelectedLocation ? (
        <div id="nearby-results" className="mx-auto w-full scroll-mt-8 px-4 sm:px-5 lg:px-20 pb-16 pt-6">
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            Designer Studios within your <span className="text-primary">{query.location}</span>
          </h2>

          {result.total > 0 ? (
            <>
              <p className="mb-5 mt-4 text-sm text-muted-foreground">{result.total} studios found</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.studios.map((studio) => (
                  <Card key={studio.providerSlug} className="rounded-2xl border-border/70 bg-white/80">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-9 w-9 border border-border/70">
                          <AvatarImage src={studio.providerPhoto || undefined} alt={studio.providerName} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {studio.providerName.charAt(0).toUpperCase() || "S"}
                          </AvatarFallback>
                        </Avatar>
                        <CardTitle className="line-clamp-1 text-lg">{studio.providerName}</CardTitle>
                        <BadgeCheck className="h-4 w-4 text-blue-500" />
                        <Badge className="ml-auto gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          <Zap className="h-3 w-3 fill-emerald-700" />
                          24hr Delivery
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {studio.city}
                          {studio.pincode ? `, ${studio.pincode}` : ""}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {studio.avgRating.toFixed(1)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {studio.itemCount} listed items · {studio.reviewCount} reviews · from Rs. {Math.round(studio.minPrice)}
                      </p>
                      <Button asChild className="w-full justify-between">
                        <Link href={`/designer-studios/provider-profile/${studio.providerSlug}`}>
                          Open Studio Profile
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="mb-6 mt-4 rounded-2xl border-dashed border-border/80 bg-muted/20">
              <CardContent className="py-6 text-sm text-muted-foreground">
                No nearby studios found for this location yet. Try another city or pin code.
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
