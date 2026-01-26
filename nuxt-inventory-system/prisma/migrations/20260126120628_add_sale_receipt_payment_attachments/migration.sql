-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'CHECK';

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "payment_method" "PaymentMethod",
ADD COLUMN     "receipt_number" TEXT;

-- CreateTable
CREATE TABLE "sale_attachments" (
    "attachment_id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "data_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "sale_attachments_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateIndex
CREATE INDEX "sale_attachments_sale_id_idx" ON "sale_attachments"("sale_id");

-- AddForeignKey
ALTER TABLE "sale_attachments" ADD CONSTRAINT "sale_attachments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("sale_id") ON DELETE RESTRICT ON UPDATE CASCADE;
