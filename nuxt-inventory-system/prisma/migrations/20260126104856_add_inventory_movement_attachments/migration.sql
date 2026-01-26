-- AlterTable
ALTER TABLE "inventory_movements" ADD COLUMN     "attachment_data_url" TEXT,
ADD COLUMN     "attachment_file_name" TEXT,
ADD COLUMN     "attachment_file_size" INTEGER,
ADD COLUMN     "attachment_file_type" TEXT,
ADD COLUMN     "notes" TEXT;
