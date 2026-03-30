CREATE INDEX IF NOT EXISTS "ListingReview_listingId_reviewerEmail_idx"
ON "ListingReview"("listingId", "reviewerEmail");
