import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, ChevronRight, MapPin, Star, Store } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { RentalProductCard } from "@/app/(public)/rentals/_components/RentalProductCard";
import { getRentalsByProviderSlug } from "@/app/(public)/rentals/_services/getRentals";

type PageProps = {
  params: Promise<{ id: string }>;
};

const placeholderImage = "/images/image.png";

function formatReviewCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listings = await getRentalsByProviderSlug(id);

  if (listings.length === 0) {
    return { title: "Designer Studio Profile | noorat" };
  }

  const provider = listings[0]!;

  return {
    title: `${provider.providerName} Studio | noorat`,
    description: `Browse all rental outfits by ${provider.providerName} in ${provider.city}.`,
  };
}

export default async function DesignerStudioProfilePage({ params }: PageProps) {
  const { id } = await params;
  const listings = await getRentalsByProviderSlug(id);

  if (listings.length === 0) {
    notFound();
  }

  const provider = listings[0]!;
  const avgRating = listings.length > 0
    ? Number((listings.reduce((sum, item) => sum + item.rating, 0) / listings.length).toFixed(1))
    : 0;
  const totalReviews = listings.reduce((sum, item) => sum + item.reviewCount, 0);
  const categories = [...new Set(listings.map((item) => item.category))];

  return (
    <div className="min-h-screen bg-white">

      {/* ── Banner ───────────────────────────────────────────────── */}
      <div className="relative h-25 w-full overflow-hidden bg-background sm:h-40">
        {/* subtle decorative dots using primary color */}
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle, var(--primary) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
      </div>

      {/* ── Profile header ───────────────────────────────────────── */}
      <div className="w-full px-4 sm:px-5 lg:px-20">
        <div className="flex items-end -mt-9 sm:-mt-12 pb-4">
          {/* Avatar overlapping banner */}
          <Avatar className="h-18 w-18 sm:h-24 sm:w-24 shrink-0 rounded-2xl border-4 border-background bg-white shadow-md">
            <AvatarImage src={provider.providerPhoto || undefined} alt={provider.providerName} />
            <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">
              <Store className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Store name */}
        <h1 className="text-lg sm:text-2xl font-extrabold uppercase tracking-wider text-foreground leading-tight">
          {provider.providerName}
        </h1>

        {/* Verified badge */}
        <div className="mt-1 flex items-center gap-1 text-xs text-blue-500 font-medium">
          <BadgeCheck className="h-3.5 w-3.5" />
          Verified Studio
        </div>

        {/* Stats row */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-0.5 font-bold text-amber-500">
            {avgRating.toFixed(1)}
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          </span>
          <span className="text-border">•</span>
          <span><strong className="text-foreground">{totalReviews.toLocaleString()}</strong> Ratings</span>
          <span className="text-border">•</span>
          <span><strong className="text-foreground">{listings.length}</strong> Products</span>
          <span className="text-border">•</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {provider.city}
          </span>
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="rounded-full text-[11px]">
                {cat}
              </Badge>
            ))}
          </div>
        )}

        {/* Breadcrumb (below header for Meesho-style compactness) */}
        <nav aria-label="breadcrumb" className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link href="/designer-studios" className="hover:text-foreground transition-colors">Designer Studios</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1 text-foreground font-medium">{provider.providerName}</span>
        </nav>

        <Separator className="mt-4" />

        {/* ── Visit Our Store Section ───────────────────────────── */}
        {(provider.providerAddress || provider.providerShopImage) && (
          <div className="mt-6 mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4">Visit Our Store</h2>
            <div className="rounded-xl border border-border/70 bg-background/40 p-5 space-y-4">
              {/* Shop Image */}
              {provider.providerShopImage && (
                <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden">
                  <img
                    src={provider.providerShopImage}
                    alt="Shop"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {/* Address */}
              {provider.providerAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 shrink-0 text-primary mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{provider.providerAddress}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {[provider.city, provider.providerState, provider.providerPincode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Listings grid ──────────────────────────────────────── */}
        <div className="mt-5 mb-3">
          <p className="text-sm font-semibold text-foreground">All items by {provider.providerName}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:gap-x-4 xl:grid-cols-4 pb-20 lg:pb-10">
          {listings.map((product) => (
            <RentalProductCard
              key={product.id}
              product={product}
              rating={product.rating > 0 ? product.rating.toFixed(1) : "0.0"}
              reviews={formatReviewCount(product.reviewCount)}
              placeholderImage={placeholderImage}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-3 pb-10">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/designer-studios">
              View all designer studios
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/rentals">
              Explore all rentals
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
