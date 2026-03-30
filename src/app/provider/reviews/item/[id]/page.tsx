import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(date: Date | string | number) {
  const normalizedDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(normalizedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(normalizedDate);
}

export default async function ProviderReviewDetailPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/auth?redirect=/provider/reviews");
  }

  const providerProfile = await prisma.providerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!providerProfile) {
    redirect("/become-a-provider/onboarding");
  }

  const { id } = await params;

  const review = await prisma.listingReview.findFirst({
    where: {
      id,
      listing: {
        providerId: providerProfile.id,
      },
    },
    select: {
      id: true,
      rating: true,
      title: true,
      comment: true,
      reviewerName: true,
      reviewerEmail: true,
      createdAt: true,
      listing: {
        select: {
          id: true,
          title: true,
          category: true,
          size: true,
        },
      },
    },
  });

  if (!review) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Link
        href="/provider/reviews"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to reviews
      </Link>

      <Card className="rounded-[28px] border-border/70 bg-white/80 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-xl">Review Detail</CardTitle>
            <Badge variant="outline" className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" /> {review.rating}/5
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>{review.listing.title}</p>
            <p>
              {review.listing.category} · Size {review.listing.size}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Reviewer</p>
            <p className="mt-1 text-sm font-medium text-foreground">{review.reviewerName}</p>
            <p className="text-sm text-muted-foreground">{review.reviewerEmail}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{formatDate(review.createdAt)}</p>
          </div>

          {review.title ? (
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Title</p>
              <p className="mt-1 text-sm font-medium text-foreground">{review.title}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Comment</p>
            <p className="mt-1 text-sm leading-6 text-foreground">{review.comment}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
