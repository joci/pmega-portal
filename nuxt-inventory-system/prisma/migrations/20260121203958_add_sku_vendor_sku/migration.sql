/*
  Warnings:

  - A unique constraint covering the columns `[sku]` on the table `items` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "items" ADD COLUMN     "vendor_sku" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "items_sku_key" ON "items"("sku");
