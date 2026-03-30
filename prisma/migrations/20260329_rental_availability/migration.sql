-- Migration: Rental availability tracking
-- Adds stockQuantity to Listing, rental dates to Order,
-- and extends OrderStatus enum with WITH_CUSTOMER and RETURNED.

-- 1. Add stockQuantity to Listing (default 1 = single physical copy)
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER NOT NULL DEFAULT 1;

-- 2. Add rental lifecycle date columns to Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "rentalStartDate"    TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "rentalEndDate"      TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "expectedReturnDate" TIMESTAMP(3);

-- 3. Extend the OrderStatus enum with new values
--    PostgreSQL requires rename+recreate to add values safely inside a transaction.
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";

CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'SHIPPED',
  'WITH_CUSTOMER',
  'RETURNED',
  'COMPLETED',
  'CANCELLED'
);

ALTER TABLE "Order"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Order"
  ALTER COLUMN "status" TYPE "OrderStatus"
  USING "status"::text::"OrderStatus";

ALTER TABLE "Order"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

DROP TYPE "OrderStatus_old";
