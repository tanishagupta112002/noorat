-- Add delivery partner role to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DELIVERY_PARTNER';

-- Delivery partner hiring invite table
CREATE TABLE "DeliveryPartnerInvite" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "phone" TEXT,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdByAdminId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DeliveryPartnerInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeliveryPartnerInvite_tokenHash_key" ON "DeliveryPartnerInvite"("tokenHash");
CREATE INDEX "DeliveryPartnerInvite_email_expiresAt_idx" ON "DeliveryPartnerInvite"("email", "expiresAt");

ALTER TABLE "DeliveryPartnerInvite"
  ADD CONSTRAINT "DeliveryPartnerInvite_createdByAdminId_fkey"
  FOREIGN KEY ("createdByAdminId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Delivery partner profile table
CREATE TYPE "DeliveryPartnerStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

CREATE TABLE "DeliveryPartnerProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "employeeCode" TEXT NOT NULL,
  "phone" TEXT,
  "city" TEXT,
  "pincode" TEXT,
  "vehicleNumber" TEXT,
  "status" "DeliveryPartnerStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DeliveryPartnerProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeliveryPartnerProfile_userId_key" ON "DeliveryPartnerProfile"("userId");
CREATE UNIQUE INDEX "DeliveryPartnerProfile_employeeCode_key" ON "DeliveryPartnerProfile"("employeeCode");
CREATE INDEX "DeliveryPartnerProfile_status_idx" ON "DeliveryPartnerProfile"("status");

ALTER TABLE "DeliveryPartnerProfile"
  ADD CONSTRAINT "DeliveryPartnerProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Delivery task table
CREATE TYPE "DeliveryTaskStage" AS ENUM (
  'ASSIGNED',
  'PICKED_UP_FROM_PROVIDER',
  'DELIVERED_TO_CUSTOMER',
  'PICKED_UP_FROM_CUSTOMER',
  'DELIVERED_TO_PROVIDER',
  'CLOSED'
);

CREATE TABLE "DeliveryTask" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "deliveryPartnerId" TEXT NOT NULL,
  "stage" "DeliveryTaskStage" NOT NULL DEFAULT 'ASSIGNED',
  "pickupProofImage" TEXT,
  "deliveryProofImage" TEXT,
  "returnPickupProofImage" TEXT,
  "providerDropProofImage" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DeliveryTask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeliveryTask_orderId_key" ON "DeliveryTask"("orderId");
CREATE INDEX "DeliveryTask_deliveryPartnerId_stage_idx" ON "DeliveryTask"("deliveryPartnerId", "stage");

ALTER TABLE "DeliveryTask"
  ADD CONSTRAINT "DeliveryTask_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DeliveryTask"
  ADD CONSTRAINT "DeliveryTask_deliveryPartnerId_fkey"
  FOREIGN KEY ("deliveryPartnerId") REFERENCES "DeliveryPartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
