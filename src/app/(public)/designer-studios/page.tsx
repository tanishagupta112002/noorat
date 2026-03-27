import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getRentals } from "@/app/(public)/rentals/_services/getRentals";

export const metadata: Metadata = {
  title: "Designer Studios | noorat",
  description: "View all designer studios and open individual provider profiles.",
};

type StudioSummary = {
  providerSlug: string;
  providerName: string;
  providerPhoto: string | null;
  city: string;
  itemCount: number;
  avgRating: number;
  reviewCount: number;
};

function buildStudioSummaries() {
  return async (): Promise<StudioSummary[]> => {
    const rentals = await getRentals();
    const map = new Map<string, StudioSummary>();

    for (const item of rentals) {
      const existing = map.get(item.providerSlug);
      if (!existing) {
        map.set(item.providerSlug, {
          providerSlug: item.providerSlug,
          providerName: item.providerName,
          providerPhoto: item.providerPhoto || null,
          city: item.city,
          itemCount: 1,
          avgRating: item.rating,
          reviewCount: item.reviewCount,
        });
        continue;
      }

      const totalRating = existing.avgRating * existing.itemCount + item.rating;
      existing.itemCount += 1;
      existing.avgRating = totalRating / existing.itemCount;
      existing.reviewCount += item.reviewCount;
      if (!existing.providerPhoto && item.providerPhoto) {
        existing.providerPhoto = item.providerPhoto;
      }
      map.set(item.providerSlug, existing);
    }

    return [...map.values()].sort((a, b) => b.avgRating - a.avgRating || b.itemCount - a.itemCount);
  };
}

const getStudioSummaries = buildStudioSummaries();

export default async function DesignerStudiosPage() {
  const studios = await getStudioSummaries();

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border/60 bg-linear-to-br from-emerald-50/75 via-background to-teal-100/55">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <Badge variant="outline" className="rounded-full bg-white/85 px-4 py-1">Designer Studios</Badge>
            <h1 className="font-playfair text-4xl font-semibold leading-tight sm:text-5xl">
              View All Designer Studios
            </h1>
            <p className="text-base leading-7 text-muted-foreground">
              Browse every studio on noorat and open individual provider profiles for full listings.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/nearby-designers">
                Nearby Designer Routes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/nearby-designers/top-rated">
                Top Rated Boutiques
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-playfair text-2xl font-semibold">All Studios</h2>
          <p className="text-sm text-muted-foreground">{studios.length} studios found</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {studios.map((studio) => (
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
                    Open Studio Profile
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
