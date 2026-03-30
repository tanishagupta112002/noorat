-- Create table for storing multiple customer addresses in DB
CREATE TABLE "CustomerAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "name" TEXT,
    "addressLine" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CustomerAddress_userId_createdAt_idx" ON "CustomerAddress"("userId", "createdAt");

ALTER TABLE "CustomerAddress"
ADD CONSTRAINT "CustomerAddress_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Snapshot selected checkout address on each order
ALTER TABLE "Order"
ADD COLUMN "deliveryName" TEXT,
ADD COLUMN "deliveryAddressLine" TEXT,
ADD COLUMN "deliveryCity" TEXT,
ADD COLUMN "deliveryState" TEXT,
ADD COLUMN "deliveryPincode" TEXT;

CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
