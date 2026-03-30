"use client";

import { useMemo, useState } from "react";

import { OrderReviewForm } from "./order-review-form";

type OrderReviewPanelProps = {
  listingId: string;
  orderId: string;
  listingTitle: string;
  alreadyReviewed: boolean;
};

export function OrderReviewPanel({
  listingId,
  orderId,
  listingTitle,
  alreadyReviewed,
}: OrderReviewPanelProps) {
  const [submitted, setSubmitted] = useState(false);
  const isReviewed = useMemo(() => alreadyReviewed || submitted, [alreadyReviewed, submitted]);

  if (isReviewed) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-semibold text-green-700">Review Submitted</p>
        <p className="mt-1 text-xs text-green-700/90">
          Thanks for sharing your experience for {listingTitle}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-white p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-foreground">Write a Review</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Share your experience for {listingTitle}.
      </p>
      <div className="mt-4">
        <OrderReviewForm
          itemId={listingId}
          orderId={orderId}
          onSubmitted={() => setSubmitted(true)}
        />
      </div>
    </div>
  );
}
