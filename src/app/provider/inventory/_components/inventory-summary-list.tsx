import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type InventoryListing = {
  id: string;
  title: string;
  size: string;
  category: string;
  color: string;
  images: string[];
  status: boolean;
  stockQuantity: number;
  price: number;
  activeOrderCount: number;
  nextAvailableAt: string | null;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateIso: string | null) {
  if (!dateIso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateIso));
}

export function InventorySummaryList({ listings }: { listings: InventoryListing[] }) {
  if (listings.length === 0) {
    return (
      <div className="rounded-[24px] border-border/70 bg-white/70 px-6 py-12 text-center text-sm text-muted-foreground shadow-sm">
        Your inventory is empty. Add your first product to start receiving orders.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => {
        const image = listing.images[0] || "/images/image.png";
        const availableUnits = Math.max(0, listing.stockQuantity - listing.activeOrderCount);

        return (
          <article key={listing.id} className="rounded-3xl border border-border/70 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-4">
              <Link
                href={`/provider/inventory/item/${listing.id}`}
                className="relative block aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted/20"
              >
                <Image src={image} alt={listing.title} fill className="object-cover" sizes="96px" />
              </Link>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground sm:text-base">{listing.title}</p>
                  <Badge variant={listing.status ? "default" : "outline"}>{listing.status ? "Active" : "Paused"}</Badge>
                </div>

                <p className="text-xs text-muted-foreground sm:text-sm">
                  {listing.category} · Size {listing.size} · {listing.color}
                </p>

                <p className="text-xs text-muted-foreground sm:text-sm">
                  Rs. {formatPrice(listing.price)} · {availableUnits} available of {listing.stockQuantity}
                  {availableUnits === 0 && listing.nextAvailableAt ? ` · Next free ${formatDate(listing.nextAvailableAt)}` : ""}
                </p>

                <div className="flex justify-end border-t border-border/70 pt-2">
                  <Link
                    href={`/provider/inventory/item/${listing.id}`}
                    className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted/40"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
