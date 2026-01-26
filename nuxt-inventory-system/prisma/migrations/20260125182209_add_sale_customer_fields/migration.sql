-- DropForeignKey
ALTER TABLE "part_requests" DROP CONSTRAINT "part_requests_part_id_fkey";

-- AlterTable
ALTER TABLE "part_requests" ADD COLUMN     "external_cost" DECIMAL(12,2),
ADD COLUMN     "external_item_name" TEXT,
ADD COLUMN     "external_model" TEXT,
ADD COLUMN     "external_receipt_data_url" TEXT,
ADD COLUMN     "external_receipt_file_name" TEXT,
ADD COLUMN     "external_receipt_file_size" INTEGER,
ADD COLUMN     "external_receipt_file_type" TEXT,
ADD COLUMN     "external_receipt_number" TEXT,
ALTER COLUMN "part_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "part_requests" ADD CONSTRAINT "part_requests_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "items"("item_id") ON DELETE SET NULL ON UPDATE CASCADE;
