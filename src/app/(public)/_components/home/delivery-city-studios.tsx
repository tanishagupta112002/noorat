import Link from "next/link";
import { MapPin, Star } from "lucide-react";

import { getDesignerStudios } from "@/app/(public)/designer-studios/_services/studio-discovery";

type CityGroup = {
  city: string;
  studios: Awaited<ReturnType<typeof getDesignerStudios>>["studios"];
};

function groupByCity(
  studios: Awaited<ReturnType<typeof getDesignerStudios>>["studios"]
): CityGroup[] {
  const byCity = new Map<string, CityGroup>();

  for (const studio of studios) {
    const key = (studio.city || "Other").trim() || "Other";
    const existing = byCity.get(key);

    if (!existing) {
      byCity.set(key, { city: key, studios: [studio] });
      continue;
    }

    existing.studios.push(studio);
    byCity.set(key, existing);
  }

  return [...byCity.values()]
    .map((group) => ({
      ...group,
      studios: [...group.studios].sort((a, b) => b.avgRating - a.avgRating || b.itemCount - a.itemCount),
    }))
    .sort((a, b) => b.studios.length - a.studios.length || a.city.localeCompare(b.city));
}

export default async function DeliveryCityStudios() {
  const result = await getDesignerStudios("all");
  const cityGroups = groupByCity(result.studios).slice(0, 8);

  return (
    <section className="w-full bg-white px-3 py-6 lg:px-20 lg:py-10">
      <div className="py-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Need an Outfit Urgently?
          </h2>
          <p className="mt-2 text-base text-muted-foreground sm:text-lg">
            Book outfit from your nearby studios.
          </p>
          <Link
            href="/designer-studios/nearby"
            className="mt-4 inline-flex h-10 items-center justify-center border border-border px-4 text-sm font-semibold uppercase tracking-[0.12em] text-primary transition hover:border-primary/60 hover:bg-primary/5"
          >
            Select Your City
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cityGroups.map((group) => (
            <article key={group.city} className="border border-border/60 bg-white p-4">
              <div className="mb-3 border-b border-border/50 pb-2">
                <h3 className="inline-flex items-center gap-1.5 text-xl font-semibold text-foreground">
                  <MapPin className="h-4 w-4 text-primary" aria-hidden="true" /> {group.city}
                </h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {group.studios.length} studios available
                </p>
              </div>

              <ul className="space-y-2">
                {group.studios.slice(0, 4).map((studio) => (
                  <li key={studio.providerSlug}>
                    <Link
                      href={`/designer-studios/provider-profile/${studio.providerSlug}`}
                      className="flex items-center justify-between gap-3 py-1 text-sm transition hover:text-primary"
                    >
                      <span className="line-clamp-1 text-foreground">{studio.providerName}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                        {studio.avgRating.toFixed(1)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                href="/designer-studios/nearby"
                className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.08em] text-primary hover:underline"
              >
                View more in {group.city}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
