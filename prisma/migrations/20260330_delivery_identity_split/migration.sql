-- Move delivery identity to a standalone auth model (no dependency on user/account role)

-- 1) Add delivery-auth fields directly on DeliveryPartnerProfile
ALTER TABLE "DeliveryPartnerProfile"
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "fullName" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

-- Backfill from linked user/account rows
UPDATE "DeliveryPartnerProfile" dp
SET
  "email" = LOWER(u."email"),
  "fullName" = COALESCE(u."name", 'Delivery Partner'),
  "passwordHash" = COALESCE(a."password", '')
FROM "user" u
LEFT JOIN "account" a
  ON a."userId" = u."id"
 AND a."providerId" = 'credential'
WHERE dp."userId" = u."id";

-- Ensure non-null values for required columns
UPDATE "DeliveryPartnerProfile"
SET "fullName" = COALESCE(NULLIF("fullName", ''), 'Delivery Partner')
WHERE "fullName" IS NULL OR "fullName" = '';

UPDATE "DeliveryPartnerProfile"
SET "email" = COALESCE(NULLIF("email", ''), LOWER('delivery+' || "id" || '@noorat.local'))
WHERE "email" IS NULL OR "email" = '';

UPDATE "DeliveryPartnerProfile"
SET "passwordHash" = COALESCE(NULLIF("passwordHash", ''), '$argon2id$v=19$m=65536,t=3,p=4$6LGQVeSiBA9KGDR5w4fgKQ$8P5q8a5FcKJ9F1wCnPNo6Y4jw0Xkg77D5huzQwFZePE')
WHERE "passwordHash" IS NULL OR "passwordHash" = '';

ALTER TABLE "DeliveryPartnerProfile"
  ALTER COLUMN "email" SET NOT NULL,
  ALTER COLUMN "fullName" SET NOT NULL,
  ALTER COLUMN "passwordHash" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryPartnerProfile_email_key" ON "DeliveryPartnerProfile"("email");

-- 2) Drop user linkage from delivery profile
ALTER TABLE "DeliveryPartnerProfile" DROP CONSTRAINT IF EXISTS "DeliveryPartnerProfile_userId_fkey";
DROP INDEX IF EXISTS "DeliveryPartnerProfile_userId_key";
ALTER TABLE "DeliveryPartnerProfile" DROP COLUMN IF EXISTS "userId";

-- 3) Create delivery sessions table
CREATE TABLE IF NOT EXISTS "DeliveryPartnerSession" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "deliveryPartnerId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DeliveryPartnerSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryPartnerSession_token_key" ON "DeliveryPartnerSession"("token");
CREATE INDEX IF NOT EXISTS "DeliveryPartnerSession_deliveryPartnerId_idx" ON "DeliveryPartnerSession"("deliveryPartnerId");
CREATE INDEX IF NOT EXISTS "DeliveryPartnerSession_expiresAt_idx" ON "DeliveryPartnerSession"("expiresAt");

ALTER TABLE "DeliveryPartnerSession"
  ADD CONSTRAINT "DeliveryPartnerSession_deliveryPartnerId_fkey"
  FOREIGN KEY ("deliveryPartnerId") REFERENCES "DeliveryPartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4) Remove delivery partner from user role enum
UPDATE "user"
SET "role" = 'CUSTOMER'
WHERE "role" = 'DELIVERY_PARTNER';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role_new" AS ENUM ('CUSTOMER', 'PROVIDER', 'ADMIN');

    ALTER TABLE "user"
      ALTER COLUMN "role" DROP DEFAULT,
      ALTER COLUMN "role" TYPE "Role_new"
      USING ("role"::text::"Role_new");

    DROP TYPE "Role";
    ALTER TYPE "Role_new" RENAME TO "Role";

    ALTER TABLE "user"
      ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
  END IF;
END $$;
