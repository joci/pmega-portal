-- AlterEnum
ALTER TYPE "PricingMode" ADD VALUE 'PRICE_LIST';

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "price_override_reason" TEXT,
ADD COLUMN     "price_updated_at" TIMESTAMP(3);
