import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { WishlistHeartButton } from "@/components/wishlist/WishlistHeartButton";

import type { PublicRental } from "../_services/getRentals";

type RentalProductCardProps = {
  product: PublicRental;
  rating: string;
  reviews: string;
  placeholderImage: string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function RentalProductCard({
  product,
  rating,
  reviews,
  placeholderImage,
}: RentalProductCardProps) {
  const images = product.images.length > 0 ? product.images : [placeholderImage];
  const primaryImage = images[0];

  const originalPrice = product.originalPrice;
  const hasDiscount = originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 0;

  return (
    <article className="group animate-in fade-in-50 slide-in-from-bottom-2 duration-300 flex flex-col h-full">
      <div className="relative overflow-hidden rounded-sm border border-border bg-muted/40">
        <WishlistHeartButton
          itemId={product.id}
          containerClassName="absolute right-2 top-2 z-10"
        />

        <Link href={`/rentals/item/${product.id}`} className="block relative aspect-3/4 w-full bg-white">
          <Image
            src={primaryImage}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 48vw, (max-width: 1200px) 30vw, 22vw"
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/95 px-2 py-1 text-xs font-bold text-foreground">
          {rating}
          <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
          <span className="font-medium text-muted-foreground">| {reviews}</span>
        </div>
      </div>

      <div className="flex flex-col flex-1 space-y-1.5 px-1 pt-2">
        <div className="flex-1 space-y-1">
          <Link href={`/designer-studios/provider-profile/${product.providerSlug}`} className="truncate text-sm font-semibold text-foreground hover:underline">
            {product.providerName}
          </Link>
          <Link href={`/rentals/item/${product.id}`} className="line-clamp-1 text-sm text-foreground/80 hover:text-foreground">
            {product.title}
          </Link>
          <p className="line-clamp-1 text-xs text-muted-foreground">{product.category} · {product.size} · {product.color}</p>
        </div>

        <div className="mt-auto rounded-md border border-border bg-muted/40 p-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Rental Price</p>
              <p className="text-xs font-bold text-foreground">Rs. {formatPrice(product.price)}</p>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Original Price</p>
              <p className={`text-xs ${hasDiscount ? "text-muted-foreground/80 line-through" : "font-semibold text-foreground/80"}`}>
                Rs. {formatPrice(originalPrice)}
              </p>
            </div>
          </div>

          {hasDiscount ? (
            <p className="mt-1.5 text-[11px] font-medium text-orange-600">Save {discountPercent}% on rent</p>
          ) : (
            <p className="mt-1.5 text-[11px] text-muted-foreground">Same as original price</p>
          )}
        </div>
      </div>
    </article>
  );
}