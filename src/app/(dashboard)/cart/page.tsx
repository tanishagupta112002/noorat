import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/server-timeout";

import { CartItemControls } from "./_components/CartItemControls";
import { CheckoutButton } from "./_components/CheckoutButton";
import { CartAvailabilityAlert } from "./_components/CartAvailabilityAlert";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

type CartRow = {
  id: string;
  listingId: string;
  quantity: number;
  listing: {
    id: string;
    title: string;
    category: string;
    size: string;
    color: string;
    price: number;
    originalPrice: number;
    images: string[];
    provider: {
      businessName: string | null;
    };
  };
};

const PLATFORM_FEE = 20;
const DELIVERY_FEE = 30;
const SECURITY_AMOUNT_PER_ITEM = 1000;

export default async function CartPage() {
  const requestHeaders = await headers();
  const sessionData = (await withTimeout(
    auth.api.getSession({ headers: requestHeaders }),
    8000,
    "Dashboard session lookup"
  )) as any;

  if (!sessionData?.user?.id) {
    redirect("/auth?mode=signup&redirect=/cart");
  }

  const cartItems = ((await withTimeout((prisma as any).cartItem.findMany({
    where: { userId: sessionData.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      listingId: true,
      quantity: true,
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
  }), 12000, "Cart query")) as CartRow[]);

  // Calculate pricing
  const actualPrice = cartItems.reduce((sum, item) => sum + item.listing.originalPrice * item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.listing.price * item.quantity, 0);
  const totalDiscount = cartItems.reduce(
    (sum, item) => sum + (item.listing.originalPrice - item.listing.price) * item.quantity,
    0
  );
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const securityAmount = totalQuantity * SECURITY_AMOUNT_PER_ITEM;
  const platformFee = PLATFORM_FEE;
  const total = subtotal + platformFee + DELIVERY_FEE + securityAmount;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-foreground">Shopping Cart</h1>
        <p className="mt-2 text-muted-foreground">
          {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div className="rounded-sm border border-[#ececec] bg-white p-6 text-center sm:p-12">
          <p className="text-lg text-muted-foreground">Your cart is empty.</p>
          <Link href="/rentals" className="mt-4 inline-block rounded-sm bg-primary px-6 py-2 font-medium text-primary-foreground transition hover:opacity-90">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-4">
            {cartItems.map((item) => {
              const listing = item.listing;
              const primaryImage = listing.images[0] || "/images/image.png";
              const discount = listing.originalPrice > listing.price 
                ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
                : 0;

              return (
                <article 
                  key={item.id} 
                  className="overflow-hidden rounded-sm border border-[#ececec] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-md"
                >
                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-5 sm:p-4 lg:grid-cols-[132px_minmax(0,1fr)_124px] xl:grid-cols-[148px_minmax(0,1fr)_150px] xl:px-5 xl:py-4">
                    {/* Product Image */}
                    <Link 
                      href={`/rentals/item/${listing.id}`} 
                      className="relative block aspect-[0.75] overflow-hidden rounded-xl bg-white"
                    >
                      <Image
                        src={primaryImage}
                        alt={listing.title}
                        fill
                        className="object-contain p-2 transition-transform"
                        sizes="(max-width: 640px) 92px, (max-width: 1024px) 132px, 148px"
                      />
                      {discount > 0 && (
                        <div className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-1 text-xs font-bold text-background">
                          {discount}% OFF
                        </div>
                      )}
                    </Link>

                    {/* Product Details */}
                    <div className="space-y-3 self-center">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                          {listing.provider.businessName || "noorat Partner"}
                        </p>
                        <Link 
                          href={`/rentals/item/${listing.id}`} 
                          className="mt-1 line-clamp-2 text-base font-semibold leading-6 text-foreground transition hover:text-primary sm:text-lg sm:leading-7"
                        >
                          {listing.title}
                        </Link>
                      </div>

                      {/* Product Specs */}
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-block rounded-full bg-[#f5f5f5] px-3 py-1 text-xs text-foreground">
                          {listing.category}
                        </span>
                        <span className="inline-block rounded-full bg-[#f5f5f5] px-3 py-1 text-xs text-foreground">
                          Size: {listing.size}
                        </span>
                        {listing.color && (
                          <span className="inline-block rounded-full bg-[#f5f5f5] px-3 py-1 text-xs text-foreground">
                            {listing.color}
                          </span>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-end gap-3">
                          {listing.originalPrice > listing.price && (
                            <p className="text-base text-muted-foreground line-through">
                              Rs. {formatPrice(listing.originalPrice)}
                            </p>
                          )}
                          <p className="text-lg font-bold leading-none text-primary">
                            Rs. {formatPrice(listing.price)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="col-span-2 flex flex-row items-center justify-between gap-4 border-t border-[#f1f1f1] pt-3 sm:col-span-2 sm:border-t sm:pt-3 lg:col-span-1 lg:min-h-full lg:flex-col lg:items-end lg:justify-between lg:border-t-0 lg:pt-0">
                      
                      <CartItemControls itemId={listing.id} quantity={item.quantity} isRental={true} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Price Summary Sidebar */}
          <aside className="h-fit rounded-sm border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)] sm:p-6 xl:sticky xl:top-6">
            <h2 className="mb-6 text-lg font-bold text-foreground">Price Details</h2>
            
            <div className="space-y-4 text-sm">
              {/* Actual Price */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Actual Price</span>
                <span className="font-semibold text-foreground">Rs. {formatPrice(actualPrice)}</span>
              </div>

              {/* Discount */}
              {totalDiscount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-500">You Save</span>
                  <span className="font-semibold text-green-500">-Rs. {formatPrice(totalDiscount)}</span>
                </div>
              )}

              {/* Rental Cost */}
              <div className="flex items-center justify-between border-y border-border py-3">
                <span className="text-muted-foreground">Rental Cost</span>
                <span className="font-semibold text-foreground">Rs. {formatPrice(subtotal)}</span>
              </div>

              {/* Delivery Fee */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-semibold text-foreground">Rs. {formatPrice(DELIVERY_FEE)}</span>
              </div>

              {/* Refundable Security Amount */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="text-muted-foreground">Refundable Security Amount</span>
                <span className="font-semibold text-foreground">Rs. {formatPrice(securityAmount)}</span>
              </div>

              {/* Platform Fee */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="font-semibold text-foreground">Rs. {formatPrice(platformFee)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="mt-6 rounded-sm border border-[#f0f0f0] bg-white p-2">
              <div className="flex items-center justify-between mb-6">
                <span className="font-bold text-foreground">Total Amount</span>
                <span className="text-base font-bold text-primary">Rs. {formatPrice(total)}</span>
              </div>

              <CartAvailabilityAlert 
                cartItems={cartItems.map((item) => ({
                  listingId: item.listingId,
                  quantity: item.quantity,
                  listing: { title: item.listing.title },
                }))} 
              />

              <CheckoutButton total={total} />
              <Link
                href="/rentals"
                className="mt-3 block w-full rounded-sm border border-[#d9d9d9] px-4 py-2 text-center text-sm font-medium text-foreground transition hover:bg-[#fafafa]"
              >
                Continue Shopping
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
