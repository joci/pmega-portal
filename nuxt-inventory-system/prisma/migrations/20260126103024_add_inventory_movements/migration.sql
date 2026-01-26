-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('RECEIPT', 'TRANSFER_IN', 'TRANSFER_OUT', 'SALE', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "inventory_movements" (
    "movement_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "movement_type" "InventoryMovementType" NOT NULL,
    "reference_id" TEXT,
    "unit_cost" DECIMAL(12,2),
    "unit_price" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("movement_id")
);

-- CreateIndex
CREATE INDEX "inventory_movements_item_id_location_id_idx" ON "inventory_movements"("item_id", "location_id");

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;
