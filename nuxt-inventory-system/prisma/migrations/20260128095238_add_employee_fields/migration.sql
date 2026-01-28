-- AlterTable
ALTER TABLE "cost_sheet_entries" ADD COLUMN     "employee_name" TEXT;

-- AlterTable
ALTER TABLE "inventory_batches" ADD COLUMN     "employee_name" TEXT;

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "employee_name" TEXT;

-- AlterTable
ALTER TABLE "maintenance_tickets" ADD COLUMN     "employee_name" TEXT;
