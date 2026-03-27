ALTER TABLE "Listing"
ADD COLUMN IF NOT EXISTS "description" TEXT;

CREATE TABLE IF NOT EXISTS "ListingReview" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "reviewerName" TEXT NOT NULL,
  "reviewerEmail" TEXT,
  "rating" INTEGER NOT NULL,
  "title" TEXT,
  "comment" TEXT NOT NULL,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ListingReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ListingReview_listingId_idx" ON "ListingReview"("listingId");

ALTER TABLE "ListingReview"
ADD CONSTRAINT "ListingReview_listingId_fkey"
FOREIGN KEY ("listingId") REFERENCES "Listing"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
