/*
  Warnings:

  - A unique constraint covering the columns `[cost_sheet_entry_id]` on the table `items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customer_device_id` to the `part_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "PricingMode" ADD VALUE 'COST_SHEET';

-- AlterTable
ALTER TABLE "customer_devices" ADD COLUMN     "item_name" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "name_amharic" TEXT,
ADD COLUMN     "tin" TEXT,
ADD COLUMN     "vat_registration_no" TEXT;

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "cost_sheet_entry_id" TEXT,
ADD COLUMN     "cost_sheet_quantity" DOUBLE PRECISION,
ADD COLUMN     "cost_sheet_total_with_vat" DECIMAL(12,2),
ADD COLUMN     "cost_sheet_unit_cost" DECIMAL(12,2),
ADD COLUMN     "cost_sheet_vat_rate" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "maintenance_tickets" ADD COLUMN     "receipt_number" TEXT,
ADD COLUMN     "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "target_delivery_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "part_requests" ADD COLUMN     "customer_device_id" TEXT NOT NULL,
ADD COLUMN     "technician_id" TEXT;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "customer_tin" TEXT,
ADD COLUMN     "customer_vat_registration_no" TEXT;

-- CreateTable
CREATE TABLE "cost_sheet_entries" (
    "cost_sheet_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "model" TEXT,
    "unit" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_cost" DECIMAL(12,2) NOT NULL,
    "total_with_vat" DECIMAL(12,2) NOT NULL,
    "vat_rate" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "cost_sheet_entries_pkey" PRIMARY KEY ("cost_sheet_id")
);

-- CreateIndex
CREATE INDEX "cost_sheet_entries_item_name_idx" ON "cost_sheet_entries"("item_name");

-- CreateIndex
CREATE UNIQUE INDEX "items_cost_sheet_entry_id_key" ON "items"("cost_sheet_entry_id");

-- CreateIndex
CREATE INDEX "part_requests_customer_device_id_idx" ON "part_requests"("customer_device_id");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_cost_sheet_entry_id_fkey" FOREIGN KEY ("cost_sheet_entry_id") REFERENCES "cost_sheet_entries"("cost_sheet_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_requests" ADD CONSTRAINT "part_requests_customer_device_id_fkey" FOREIGN KEY ("customer_device_id") REFERENCES "customer_devices"("device_id") ON DELETE RESTRICT ON UPDATE CASCADE;
