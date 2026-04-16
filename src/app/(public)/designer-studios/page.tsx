import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, Scissors, Star, Store } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { StudioSummary } from "@/app/(public)/designer-studios/_services/studio-discovery";
import { getDesignerStudios } from "@/app/(public)/designer-studios/_services/studio-discovery";

export const metadata: Metadata = {
  title: "Designer Studios | noorat",
  description: "Browse boutiques and rental shops — discover occasionwear near you.",
};

function StudioCard({ studio }: { studio: StudioSummary }) {
  return (
    <Card className="min-w-80 shrink-0 rounded-2xl border-border/70 bg-white/80 lg:min-w-96">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-9 w-9 border border-border/70">
            <AvatarImage src={studio.providerPhoto || undefined} alt={studio.providerName} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {studio.providerName.charAt(0).toUpperCase() || "S"}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="line-clamp-1 text-base">{studio.providerName}</CardTitle>
          <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {studio.city}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {studio.avgRating.toFixed(1)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {studio.itemCount} listed items · {studio.reviewCount} reviews
        </p>
        <Button asChild className="w-full justify-between">
          <Link href={`/designer-studios/provider-profile/${studio.providerSlug}`}>
            Open Profile
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default async function DesignerStudiosPage() {
  const result = await getDesignerStudios("all");
  const studios = result.studios;

  const boutiques = studios.filter((s) => s.providerType === "BOUTIQUE");
  const rentalShops = studios.filter((s) => s.providerType === "RENTAL");
  const uncategorised = studios.filter((s) => !s.providerType);

  return (
    <div className="min-h-screen bg-white text-foreground">
      <div className="mx-auto w-full px-4 sm:px-5 lg:px-20 pb-16 pt-4">

        {/* Top nav bar */}
        <div className="mb-6 border-y border-border py-2.5">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/designer-studios/nearby">
                Nearby Studios
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Boutiques */}
        {boutiques.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-rose-500" />
                <h2 className="font-playfair text-2xl font-semibold">Boutiques</h2>
              </div>
              <Badge variant="outline" className="rounded-full border-rose-200 bg-rose-50 text-rose-700">
                {boutiques.length} studios
              </Badge>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Designer boutiques offering custom stitching, bridal wear and curated occasionwear.
            </p>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {boutiques.map((studio) => (
                <StudioCard key={studio.providerSlug} studio={studio} />
              ))}
            </div>
          </section>
        )}

        {boutiques.length > 0 && rentalShops.length > 0 && <Separator className="mb-12" />}

        {/* Rental Shops */}
        {rentalShops.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-orange-500" />
                <h2 className="font-playfair text-2xl font-semibold">Rental Shops</h2>
              </div>
              <Badge variant="outline" className="rounded-full border-orange-200 bg-orange-50 text-orange-700">
                {rentalShops.length} shops
              </Badge>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Rental shops for lehengas, sarees, sherwanis and more — affordable occasionwear on rent.
            </p>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {rentalShops.map((studio) => (
                <StudioCard key={studio.providerSlug} studio={studio} />
              ))}
            </div>
          </section>
        )}

        {/* Uncategorised fallback */}
        {uncategorised.length > 0 && (
          <section>
            {(boutiques.length > 0 || rentalShops.length > 0) && <Separator className="mb-12" />}
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-playfair text-2xl font-semibold">Other Studios</h2>
              <Badge variant="outline" className="rounded-full">
                {uncategorised.length}
              </Badge>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {uncategorised.map((studio) => (
                <StudioCard key={studio.providerSlug} studio={studio} />
              ))}
            </div>
          </section>
        )}

        {studios.length === 0 && (
          <p className="py-20 text-center text-muted-foreground">No studios found at the moment.</p>
        )}
      </div>
    </div>
  );
}
