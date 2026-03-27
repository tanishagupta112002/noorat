-- Switch provider ownership identity from User.id to ProviderProfile.id
-- 1) Backfill existing Listing/Order providerId values from userId to ProviderProfile.id
-- 2) Re-point foreign keys to ProviderProfile(id)

BEGIN;

-- Backfill listing provider ids
UPDATE "Listing" l
SET "providerId" = p."id"
FROM "ProviderProfile" p
WHERE l."providerId" = p."userId";

-- Backfill order provider ids
UPDATE "Order" o
SET "providerId" = p."id"
FROM "ProviderProfile" p
WHERE o."providerId" = p."userId";

-- Drop old foreign keys on Listing.providerId and Order.providerId dynamically
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname AS constraint_name, t.relname AS table_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'f'
      AND t.relname IN ('Listing', 'Order')
      AND a.attname = 'providerId'
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', r.table_name, r.constraint_name);
  END LOOP;
END $$;

-- Add new provider foreign keys to ProviderProfile(id)
ALTER TABLE "Listing"
ADD CONSTRAINT "Listing_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order"
ADD CONSTRAINT "Order_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
