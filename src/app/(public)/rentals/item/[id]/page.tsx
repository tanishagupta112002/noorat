import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  MapPin,
  Scissors,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { WishlistHeartButton } from "@/components/wishlist/WishlistHeartButton";

import { RentalProductCard } from "@/app/(public)/rentals/_components/RentalProductCard";
import {
  getListingReviews,
  getRentalById,
  getRentals,
  getRentalsByProviderSlug,
  getSimilarRentals,
} from "@/app/(public)/rentals/_services/getRentals";

import { ImageGallery } from "./_components/ImageGallery";
import RentalPolicyBadges from "./_components/RentalPolicyBadges";
import { ReviewForm } from "./_components/ReviewForm";
import DeliveryDetailsCard from "./_components/DeliveryDetailsCard";

type PageProps = {
  params: Promise<{ id: string }>;
};

const placeholderImage = "/images/image.png";

export async function generateStaticParams() {
  const rentals = await getRentals();
  return rentals.map((rental) => ({ id: rental.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const rental = await getRentalById(id);

  if (!rental) {
    return { title: "Rental Details | TaniTwirl" };
  }

  return {
    title: `${rental.title} | TaniTwirl`,
    description: rental.description || `${rental.category} rental by ${rental.providerName} in ${rental.city}.`,
  };
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function formatReviewCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

function formatReviewDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

function buildRatingDistribution(ratings: number[]) {
  const buckets = [0, 0, 0, 0, 0];
  for (const rating of ratings) {
    if (rating >= 1 && rating <= 5) buckets[rating - 1] += 1;
  }
  return buckets;
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const full = i < Math.floor(rating);
        const half = !full && i < rating;
        return (
          <Star
            key={i}
            className={`${sz} ${
              full
                ? "fill-amber-400 text-amber-400"
                : half
                  ? "fill-amber-200 text-amber-400"
                  : "text-muted-foreground/25"
            }`}
          />
        );
      })}
    </span>
  );
}

export default async function RentalDetailPage({ params }: PageProps) {
  const { id } = await params;
  const rental = await getRentalById(id);

  if (!rental) {
    notFound();
  }

  const [reviews, similar, providerListings] = await Promise.all([
    getListingReviews(id),
    getSimilarRentals(id, rental.category, 4),
    getRentalsByProviderSlug(rental.providerSlug),
  ]);

  const ratings = reviews.map((review) => review.rating);
  const averageRating = ratings.length > 0
    ? Number((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1))
    : rental.rating;
  const ratingDist = buildRatingDistribution(ratings);
  const totalReviews = reviews.length;

  const hasDiscount = rental.originalPrice > rental.price;
  const discountPct = hasDiscount
    ? Math.round(((rental.originalPrice - rental.price) / rental.originalPrice) * 100)
    : 0;

  const colorList = rental.color
    .split(/[,&/|]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const providerItemCount = providerListings.length;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-border/60 bg-muted/30">
        <nav
          aria-label="breadcrumb"
          className="mx-auto flex max-w-360 items-center gap-1 px-5 py-2 sm:py-3 text-xs text-muted-foreground sm:px-8 xl:px-10"
        >
          <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link href="/rentals" className="transition-colors hover:text-foreground">Rentals</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1 font-medium text-foreground">{rental.title}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-360 px-5 py-6 sm:py-8 lg:py-10 sm:px-8 xl:px-10">
        <div className="grid gap-4 sm:gap-6 xl:gap-10 grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.75fr)_minmax(280px,0.9fr)] xl:items-start">
          <ImageGallery
            title={rental.title}
            accentClass="from-stone-200 via-zinc-100 to-slate-100"
            images={rental.images}
            category={rental.category}
          />

          <div className="space-y-3 sm:space-y-4 xl:space-y-6 xl:pr-2">
            <Link
              href={`/designer-studios/provider-profile/${rental.providerSlug}`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
            >
              <Store className="h-3.5 w-3.5" />
              {rental.providerName}
              <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
            </Link>

            <div className="flex items-start justify-between gap-3">
              <h1 className="font-playfair text-lg sm:text-xl font-semibold leading-tight md:text-2xl">
                {rental.title}
              </h1>
              <WishlistHeartButton itemId={rental.id} />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
              <StarRow rating={averageRating} />
              <span className="font-semibold text-amber-600">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">·</span>
              <a href="#reviews" className="text-primary hover:underline">
                {totalReviews > 0 ? `${formatReviewCount(totalReviews)} reviews` : "No reviews yet"}
              </a>
              <span className="text-muted-foreground">·</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {rental.city}
              </span>
            </div>

            <div className="rounded-lg sm:rounded-[24px] border border-border/60 bg-white p-4 sm:p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
              <div className="space-y-2 sm:space-y-1.5">
                <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl font-bold text-foreground">Rs.&nbsp;{formatPrice(rental.price)}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">for 3 days</span>
                  {hasDiscount ? (
                    <>
                      <span className="text-xs sm:text-base text-muted-foreground line-through">Rs.&nbsp;{formatPrice(rental.originalPrice)}</span>
                      <Badge className="rounded-full border-green-200 bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-100">
                        {discountPct}% off
                      </Badge>
                    </>
                  ) : null}
                </div>
                {hasDiscount ? (
                  <p className="text-xs sm:text-sm font-medium text-green-700">
                    You save Rs.&nbsp;{formatPrice(rental.originalPrice - rental.price)} on rental
                  </p>
                ) : null}
                <div className="bg-muted/20 px-3 py-2 sm:py-2.5 text-xs sm:text-sm rounded-md">
                  <span className="font-semibold">Security:</span>{" "}
                  <span className="text-muted-foreground">Rs. 1000 refundable</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg sm:rounded-[24px] border border-border/60 bg-white p-4 sm:p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
              <h1 className="text-base sm:text-lg font-semibold text-foreground mb-2">Product Details</h1>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <p className="text-xs sm:text-sm">
                  <span className="font-semibold">Size:</span>{" "}
                  <span className="rounded-md border border-border bg-muted px-2.5 py-0.5 font-medium">
                    {rental.size}
                  </span>
                </p>
                <Link href="/size-guide" className="text-xs text-primary hover:underline shrink-0">Size Guide →</Link>
              </div>

              <p className="mt-2 sm:mt-3 text-xs sm:text-sm">
                <span className="font-semibold">Fabric: </span>
                <span className="text-muted-foreground">{rental.fabric}</span>
              </p>

              {colorList.length > 0 ? (
                <div className="mt-2 sm:mt-3 space-y-2">
                  <p className="text-xs sm:text-sm font-semibold">Available Colors</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {colorList.map((color) => (
                      <span
                        key={color}
                        className="rounded-full border border-border bg-muted/50 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs font-medium"
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            
          </div>

          <div className="w-full">
            <RentalPolicyBadges />
          </div>

          <div className="w-full space-y-3 sm:space-y-4 xl:col-start-2 xl:col-span-2">
            <DeliveryDetailsCard />
            {/* Desktop buttons — inside grid column */}
            <div className="hidden xl:flex gap-2">
              <AddToCartButton
                itemId={rental.id}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
              >
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </>
              </AddToCartButton>
              <Button asChild size="lg" className="flex-1 gap-2 h-11 text-sm shadow-sm">
                <Link href="/cart">
                  <ShoppingCart className="h-4 w-4" />
                  Rent Now
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile sticky buttons — outside grid, inside main wrapper so sticky range starts from image */}
        <div className="xl:hidden sticky bottom-0 z-20 flex gap-2 bg-background/95 backdrop-blur-sm border-t border-border/60 px-5 py-3 -mx-5 sm:-mx-8">
          <AddToCartButton
            itemId={rental.id}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
          >
            <>
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </>
          </AddToCartButton>
          <Button asChild size="lg" className="flex-1 gap-2 h-11 text-sm shadow-sm">
            <Link href="/cart">
              <ShoppingCart className="h-4 w-4" />
              Rent Now
            </Link>
          </Button>
        </div>
        
      </div>



      <div id="reviews" className="border-y border-border/60 bg-muted/20">
        <div className="mx-auto max-w-360 px-5 py-8 sm:py-10 sm:px-8 xl:px-10">
          <div className="grid gap-6 sm:gap-10 lg:grid-cols-[260px_1fr] lg:items-start">
            <div className="space-y-4 sm:space-y-5">
              <h2 className="font-playfair text-xl sm:text-2xl font-semibold">Customer Reviews</h2>
              <div className="flex items-end gap-2 sm:gap-3">
                <span className="font-playfair text-3xl sm:text-5xl font-bold leading-none">{averageRating.toFixed(1)}</span>
                <div className="space-y-1 pb-0.5">
                  <StarRow rating={averageRating} size="lg" />
                  <p className="text-xs sm:text-sm text-muted-foreground">{totalReviews} ratings</p>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2 hidden sm:block">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const count = ratingDist[star - 1] ?? 0;
                  const total = ratingDist.reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-8 shrink-0 text-right text-muted-foreground">{star} ★</span>
                      <Progress value={pct} className="h-2 flex-1" />
                      <span className="w-8 shrink-0 text-muted-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="space-y-2 sm:space-y-3 rounded-lg sm:rounded-2xl border border-border/60 bg-white p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                        <Avatar className="h-8 sm:h-9 w-8 sm:w-9 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {review.reviewerName
                              .split(" ")
                              .map((part) => part.charAt(0))
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold truncate block">{review.reviewerName}</span>
                          <div className="text-xs text-muted-foreground">{formatReviewDate(review.createdAt)}</div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <StarRow rating={review.rating} />
                      </div>
                    </div>
                    {review.title ? <p className="text-xs sm:text-sm font-semibold">{review.title}</p> : null}
                    <p className="text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground">{review.comment}</p>
                    {review.imageUrl ? (
                      <div className="relative h-32 sm:h-40 w-24 sm:w-32 overflow-hidden rounded-md border border-border/60 bg-muted/20">
                        <Image src={review.imageUrl} alt="Review upload" fill className="object-contain p-1" />
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">No reviews yet.</p>
              )}
            </div>
          </div>

          <div className="mt-6 sm:mt-10 rounded-lg sm:rounded-2xl border border-border/60 bg-white p-5 sm:p-6">
            <h3 className="font-playfair text-lg sm:text-xl font-semibold">Write a Review</h3>
            <p className="mb-4 sm:mb-5 mt-1 text-xs sm:text-sm text-muted-foreground">Share your experience to help others.</p>
            <ReviewForm itemId={id} />
          </div>
        </div>
      </div>

      {similar.length > 0 ? (
        <div className="mx-auto max-w-360 px-5 py-8 sm:py-10 sm:px-8 xl:px-10">
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <h2 className="font-playfair text-xl sm:text-2xl font-semibold">You May Also Like</h2>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs sm:text-sm h-8 sm:h-10">
              <Link href="/rentals">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-4 sm:gap-x-3 sm:gap-y-6 md:grid-cols-3 lg:gap-x-4 xl:grid-cols-4 items-stretch">
            {similar.map((product) => (
              <RentalProductCard
                key={product.id}
                product={product}
                rating={product.rating > 0 ? product.rating.toFixed(1) : "0.0"}
                reviews={formatReviewCount(product.reviewCount)}
                placeholderImage={placeholderImage}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
