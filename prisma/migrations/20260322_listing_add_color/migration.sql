-- Add color field for backend-driven rental color filters
ALTER TABLE "Listing"
ADD COLUMN "color" TEXT NOT NULL DEFAULT 'Assorted';
