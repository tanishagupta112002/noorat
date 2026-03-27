import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { WishlistHeartButton } from "@/components/wishlist/WishlistHeartButton";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function WishlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/auth?mode=signup&redirect=/wishlist");
  }

  const wishlistItems = await prisma.wishlist.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      listing: {
        select: {
          id: true,
          title: true,
          category: true,
          size: true,
          color: true,
          price: true,
          originalPrice: true,
          images: true,
          provider: {
            select: {
              businessName: true,
            },
          },
        },
      },
    },
  });


  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-foreground">My Wishlist</h1>
        <p className="mt-2 text-muted-foreground">
          {wishlistItems.length} saved {wishlistItems.length === 1 ? "item" : "items"}
        </p>
      </div>
      {wishlistItems.length === 0 ? (
        <div className="rounded-sm border border-[#ececec] bg-white p-12 text-center">
          <p className="mb-4 text-lg text-muted-foreground">No favorites yet.</p>
          <Link href="/rentals" className="inline-block rounded-sm bg-primary px-6 py-2 font-medium text-primary-foreground transition hover:opacity-90">
            Browse Items
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlistItems.map((item) => {
            const listing = item.listing;
            const primaryImage = listing.images[0] || "/images/image.png";
            const hasDiscount = listing.originalPrice > listing.price;

            return (
              <article key={item.id} className="relative overflow-hidden rounded-sm border border-[#ececec] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-md">
                <WishlistHeartButton
                  itemId={listing.id}
                  containerClassName="absolute right-3 top-3 z-10"
                />
                <Link href={`/rentals/item/${listing.id}`} className="relative block aspect-3/4 overflow-hidden bg-white">
                  <Image
                    src={primaryImage}
                    alt={listing.title}
                    fill
                    className="object-contain p-2 transition-transform"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </Link>

                <div className="space-y-3 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">{listing.provider.businessName || "TaniTwirl Partner"}</p>
                  <Link href={`/rentals/item/${listing.id}`} className="line-clamp-2 text-sm font-semibold text-foreground transition hover:text-primary">
                    {listing.title}
                  </Link>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-block rounded-full bg-[#f5f5f5] px-2 py-1 text-xs text-foreground">
                      {listing.category}
                    </span>
                    <span className="inline-block rounded-full bg-[#f5f5f5] px-2 py-1 text-xs text-foreground">
                      {listing.size}
                    </span>
                    {listing.color && (
                      <span className="inline-block rounded-full bg-[#f5f5f5] px-2 py-1 text-xs text-foreground">
                        {listing.color}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 pt-2">
                    <p className="text-base font-bold text-primary">Rs. {formatPrice(listing.price)}</p>
                    {hasDiscount ? (
                      <p className="text-xs text-muted-foreground line-through">Rs. {formatPrice(listing.originalPrice)}</p>
                    ) : null}
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <AddToCartButton
                      itemId={listing.id}
                      className="inline-flex items-center justify-center rounded-sm border border-[#d9d9d9] bg-white px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-[#fafafa]"
                    >
                      Add to Cart
                    </AddToCartButton>
                    <Link
                      href={`/rentals/item/${listing.id}`}
                      className="inline-flex items-center justify-center rounded-sm bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      Rent Now
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}