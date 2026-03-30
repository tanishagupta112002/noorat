BEGIN;

CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'PROVIDER', 'ADMIN');
CREATE TYPE "ProviderType" AS ENUM ('BOUTIQUE', 'RENTAL');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'ACCEPTED', 'SHIPPED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "user" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "password" TEXT,
  "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "pincode" TEXT,
  "alternative_mobile_number" TEXT,
  "dob" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

CREATE TABLE "ProviderProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "providerType" "ProviderType",
  "businessName" TEXT,
  "phone" TEXT NOT NULL,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "pincode" TEXT,
  "description" TEXT,
  "bankAccountNumber" TEXT,
  "bankIfsc" TEXT,
  "bankAccountName" TEXT,
  "panNumber" TEXT,
  "idDocument" TEXT,
  "signature" TEXT,
  "stepMobileVerified" BOOLEAN NOT NULL DEFAULT false,
  "stepIdentityVerified" BOOLEAN NOT NULL DEFAULT false,
  "stepStoreDetails" BOOLEAN NOT NULL DEFAULT false,
  "stepPickupAddress" BOOLEAN NOT NULL DEFAULT false,
  "stepBankDetails" BOOLEAN NOT NULL DEFAULT false,
  "stepFirstListing" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProviderProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderProfile_userId_key" ON "ProviderProfile"("userId");

CREATE TABLE "Listing" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "Fabric" TEXT NOT NULL,
  "images" TEXT[] NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "category" TEXT NOT NULL,
  "status" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "total" DOUBLE PRECISION NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenExpiresAt" TIMESTAMP(3),
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "account_accountId_providerId_key" ON "account"("accountId", "providerId");
CREATE INDEX "account_userId_idx" ON "account"("userId");

CREATE TABLE "session" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "session_token_key" ON "session"("token");
CREATE INDEX "session_userId_idx" ON "session"("userId");

CREATE TABLE "verification" (
  "id" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

CREATE TABLE "Wishlist" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Wishlist_userId_listingId_key" ON "Wishlist"("userId", "listingId");
CREATE INDEX "Wishlist_userId_idx" ON "Wishlist"("userId");
CREATE INDEX "Wishlist_listingId_idx" ON "Wishlist"("listingId");

CREATE TABLE "CartItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CartItem_userId_listingId_key" ON "CartItem"("userId", "listingId");
CREATE INDEX "CartItem_userId_idx" ON "CartItem"("userId");
CREATE INDEX "CartItem_listingId_idx" ON "CartItem"("listingId");

ALTER TABLE "ProviderProfile"
  ADD CONSTRAINT "ProviderProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Listing"
  ADD CONSTRAINT "Listing_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "account"
  ADD CONSTRAINT "account_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "session"
  ADD CONSTRAINT "session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Wishlist"
  ADD CONSTRAINT "Wishlist_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Wishlist"
  ADD CONSTRAINT "Wishlist_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartItem"
  ADD CONSTRAINT "CartItem_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartItem"
  ADD CONSTRAINT "CartItem_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
