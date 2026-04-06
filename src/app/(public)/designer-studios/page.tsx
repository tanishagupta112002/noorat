import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getDesignerStudios } from "@/app/(public)/designer-studios/_services/studio-discovery";

export const metadata: Metadata = {
  title: "Designer Studios | noorat",
  description: "View all designer studios and open individual provider profiles.",
};

export default async function DesignerStudiosPage() {
  const result = await getDesignerStudios("all");
  const studios = result.studios;

  return (
    <div className="min-h-screen bg-white text-foreground">
      <div className="mx-auto w-full px-4 sm:px-5 lg:px-20 pb-16 pt-4">
        <div className="mb-4 border-y border-border py-2.5">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/designer-studios/nearby">
                Nearby Designer Studios
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <section>
          <p className="mb-4 text-sm text-muted-foreground">{studios.length} studios found</p>
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
        </section>
      </div>
    </div>
  );
}
