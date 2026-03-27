import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, MapPin, Star, Store } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { RentalProductCard } from "@/app/(public)/rentals/_components/RentalProductCard";
import { getRentals, getRentalsByProviderSlug } from "@/app/(public)/rentals/_services/getRentals";

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

export async function generateStaticParams() {
  const rentals = await getRentals();
  const slugs = [...new Set(rentals.map((item) => item.providerSlug))];
  return slugs.map((id) => ({ id }));
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
    <div className="min-h-screen bg-background">
      <section className="border-b border-border/60 bg-linear-to-br from-muted/60 to-background">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6 gap-1.5 text-muted-foreground hover:text-foreground">
            <Link href="/designer-studios">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Designer Studios
            </Link>
          </Button>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <Avatar className="h-20 w-20 shrink-0 rounded-2xl border border-border/70 shadow-md">
              <AvatarImage src={provider.providerPhoto || undefined} alt={provider.providerName} />
              <AvatarFallback className="bg-background/80 text-primary backdrop-blur">
                <Store className="h-9 w-9" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-playfair text-3xl font-semibold sm:text-4xl">{provider.providerName}</h1>
                <BadgeCheck className="h-6 w-6 text-blue-500" />
                <Badge variant="outline" className="rounded-full bg-background/80">Verified Studio</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {provider.city}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
                  <span>({totalReviews} ratings)</span>
                </span>
                <span>{listings.length} items listed</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="rounded-full text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{listings.length} Outfits Available</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Ships from {provider.city}</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {avgRating.toFixed(1)} avg rating
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="mb-6 font-playfair text-xl font-semibold">All items by {provider.providerName}</h2>

        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:gap-x-4 xl:grid-cols-4">
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

        <div className="mt-12 flex justify-center gap-3">
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
