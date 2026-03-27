-- Add original price so public rentals can show real price and rental price from DB
ALTER TABLE "Listing"
ADD COLUMN "originalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "Listing"
SET "originalPrice" = "price"
WHERE "originalPrice" = 0;