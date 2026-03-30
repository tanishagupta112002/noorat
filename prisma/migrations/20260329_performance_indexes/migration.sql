CREATE INDEX IF NOT EXISTS "Listing_providerId_idx" ON "Listing"("providerId");
CREATE INDEX IF NOT EXISTS "Listing_status_createdAt_idx" ON "Listing"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "Order_providerId_createdAt_idx" ON "Order"("providerId", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_providerId_status_createdAt_idx" ON "Order"("providerId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
