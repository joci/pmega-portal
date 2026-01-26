-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'CONFLICT');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('PRODUCT', 'SPARE_PART', 'BOTH');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('PRODUCT', 'SPARE_PART');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('STORE', 'WORKSHOP', 'WAREHOUSE');

-- CreateEnum
CREATE TYPE "StockLocation" AS ENUM ('STORE', 'WORKSHOP', 'BOTH');

-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('MANUAL', 'MARGIN_PERCENT');

-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('RETAIL', 'MAINTENANCE', 'INTERNAL');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "LineType" AS ENUM ('PRODUCT', 'SPARE_PART', 'LABOR', 'FEE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'DIAGNOSIS', 'WAITING_PARTS', 'IN_PROGRESS', 'TESTING', 'COMPLETED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('IN_WARRANTY', 'OUT_OF_WARRANTY', 'EXTENDED');

-- CreateEnum
CREATE TYPE "PartSource" AS ENUM ('STORE_INVENTORY', 'EXTERNAL_SUPPLIER', 'CUSTOMER_PROVIDED');

-- CreateEnum
CREATE TYPE "PartRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'CREDIT', 'MOBILE');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PAYMENT', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentState" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('RETAIL', 'MAINTENANCE', 'BOTH');

-- CreateEnum
CREATE TYPE "MaintenancePaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'INVOICED');

-- CreateTable
CREATE TABLE "categories" (
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_type" "CategoryType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "locations" (
    "location_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location_type" "LocationType" NOT NULL,
    "sub_city" TEXT,
    "house_no" TEXT,
    "city" TEXT,
    "country" TEXT,
    "po_box" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "locations_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "units" (
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "units_pkey" PRIMARY KEY ("unit_id")
);

-- CreateTable
CREATE TABLE "items" (
    "item_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "cost" DECIMAL(12,2) NOT NULL,
    "category_id" TEXT,
    "location_id" TEXT,
    "item_type" "ItemType" NOT NULL,
    "is_for_maintenance" BOOLEAN NOT NULL,
    "min_stock_level" INTEGER NOT NULL,
    "reorder_quantity" INTEGER NOT NULL,
    "stock_location" "StockLocation" NOT NULL,
    "sku" TEXT,
    "barcode" TEXT,
    "weight" DOUBLE PRECISION,
    "dimensions" TEXT,
    "manufacturer" TEXT,
    "warranty_period" INTEGER,
    "unit" TEXT,
    "pricing_mode" "PricingMode" NOT NULL DEFAULT 'MANUAL',
    "margin_percent" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "items_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "inventory_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "reserved_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "batch_number" TEXT,
    "expiry_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("inventory_id")
);

-- CreateTable
CREATE TABLE "inventory_batches" (
    "batch_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL,
    "quantity_received" DOUBLE PRECISION NOT NULL,
    "quantity_remaining" DOUBLE PRECISION NOT NULL,
    "unit_cost" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "inventory_batches_pkey" PRIMARY KEY ("batch_id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "attachment_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "data_url" TEXT NOT NULL,
    "sort_order" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateTable
CREATE TABLE "customers" (
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address_id" TEXT,
    "customer_type" "CustomerType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "customer_devices" (
    "device_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "catalog_item_id" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "serial_number" TEXT,
    "purchase_date" TIMESTAMP(3),
    "warranty_expiry" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "customer_devices_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "sales" (
    "sale_id" TEXT NOT NULL,
    "sale_number" TEXT,
    "sale_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sale_type" "SaleType" NOT NULL,
    "status" "SaleStatus" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL,
    "customer_id" TEXT,
    "maintenance_ticket_id" TEXT,
    "supplier_name" TEXT,
    "supplier_tin" TEXT,
    "vat_registration_date" TIMESTAMP(3),
    "supplier_vat_registration_no" TEXT,
    "supplier_address_sub_city" TEXT,
    "supplier_address_house_no" TEXT,
    "supplier_address_city" TEXT,
    "supplier_address_country" TEXT,
    "supplier_address_po_box" TEXT,
    "subtotal_amount" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "is_repair_service" BOOLEAN,
    "repair_service_id" TEXT,
    "performed_by" TEXT,
    "shipping_address_id" TEXT,
    "notes" TEXT,
    "location_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "sales_pkey" PRIMARY KEY ("sale_id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "sale_item_id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "item_id" TEXT,
    "description" TEXT,
    "line_type" "LineType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,
    "affects_inventory" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("sale_item_id")
);

-- CreateTable
CREATE TABLE "payments" (
    "payment_id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_type" "PaymentType" NOT NULL,
    "status" "PaymentState" NOT NULL,
    "transaction_reference" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "maintenance_tickets" (
    "ticket_id" TEXT NOT NULL,
    "ticket_number" TEXT,
    "customer_id" TEXT NOT NULL,
    "customer_device_id" TEXT NOT NULL,
    "technician_id" TEXT,
    "status" "TicketStatus" NOT NULL,
    "problem_description" TEXT NOT NULL,
    "diagnosis" TEXT,
    "estimated_cost" DECIMAL(12,2),
    "estimated_completion" TIMESTAMP(3),
    "repair_cost" DECIMAL(12,2),
    "labor_cost" DECIMAL(12,2),
    "labor_hours" DOUBLE PRECISION,
    "total_cost" DECIMAL(12,2),
    "payment_status" "MaintenancePaymentStatus",
    "priority" "TicketPriority" NOT NULL,
    "warranty_status" "WarrantyStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',
    "location_id" TEXT NOT NULL,

    CONSTRAINT "maintenance_tickets_pkey" PRIMARY KEY ("ticket_id")
);

-- CreateTable
CREATE TABLE "part_requests" (
    "request_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "part_id" TEXT NOT NULL,
    "quantity_requested" DOUBLE PRECISION NOT NULL,
    "requested_by" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "status" "PartRequestStatus" NOT NULL,
    "source_preference" "PartSource" NOT NULL,
    "notes" TEXT,
    "location_id" TEXT NOT NULL,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "part_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "part_usage" (
    "usage_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "request_id" TEXT,
    "sale_item_id" TEXT,
    "part_id" TEXT NOT NULL,
    "quantity_used" DOUBLE PRECISION NOT NULL,
    "unit_cost" DECIMAL(12,2) NOT NULL,
    "total_cost" DECIMAL(12,2),
    "source" "PartSource" NOT NULL,
    "external_supplier_id" TEXT,
    "external_reference" TEXT,
    "used_by" TEXT,
    "used_at" TIMESTAMP(3),
    "notes" TEXT,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',
    "location_id" TEXT NOT NULL,

    CONSTRAINT "part_usage_pkey" PRIMARY KEY ("usage_id")
);

-- CreateTable
CREATE TABLE "settings" (
    "setting_id" TEXT NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT,
    "setting_type" "SettingType" NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "is_editable" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "settings_pkey" PRIMARY KEY ("setting_id")
);

-- CreateIndex
CREATE INDEX "items_category_id_idx" ON "items"("category_id");

-- CreateIndex
CREATE INDEX "items_location_id_idx" ON "items"("location_id");

-- CreateIndex
CREATE INDEX "inventory_location_id_idx" ON "inventory"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_item_id_location_id_key" ON "inventory"("item_id", "location_id");

-- CreateIndex
CREATE INDEX "inventory_batches_item_id_location_id_idx" ON "inventory_batches"("item_id", "location_id");

-- CreateIndex
CREATE INDEX "attachments_item_id_idx" ON "attachments"("item_id");

-- CreateIndex
CREATE INDEX "customer_devices_customer_id_idx" ON "customer_devices"("customer_id");

-- CreateIndex
CREATE INDEX "customer_devices_catalog_item_id_idx" ON "customer_devices"("catalog_item_id");

-- CreateIndex
CREATE INDEX "sales_sale_date_idx" ON "sales"("sale_date");

-- CreateIndex
CREATE INDEX "sales_location_id_idx" ON "sales"("location_id");

-- CreateIndex
CREATE INDEX "sale_items_sale_id_idx" ON "sale_items"("sale_id");

-- CreateIndex
CREATE INDEX "sale_items_item_id_idx" ON "sale_items"("item_id");

-- CreateIndex
CREATE INDEX "payments_sale_id_idx" ON "payments"("sale_id");

-- CreateIndex
CREATE INDEX "maintenance_tickets_customer_id_idx" ON "maintenance_tickets"("customer_id");

-- CreateIndex
CREATE INDEX "maintenance_tickets_customer_device_id_idx" ON "maintenance_tickets"("customer_device_id");

-- CreateIndex
CREATE INDEX "maintenance_tickets_location_id_idx" ON "maintenance_tickets"("location_id");

-- CreateIndex
CREATE INDEX "part_requests_ticket_id_idx" ON "part_requests"("ticket_id");

-- CreateIndex
CREATE INDEX "part_requests_part_id_idx" ON "part_requests"("part_id");

-- CreateIndex
CREATE INDEX "part_usage_ticket_id_idx" ON "part_usage"("ticket_id");

-- CreateIndex
CREATE INDEX "part_usage_part_id_idx" ON "part_usage"("part_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_setting_key_key" ON "settings"("setting_key");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_devices" ADD CONSTRAINT "customer_devices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_devices" ADD CONSTRAINT "customer_devices_catalog_item_id_fkey" FOREIGN KEY ("catalog_item_id") REFERENCES "items"("item_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_maintenance_ticket_id_fkey" FOREIGN KEY ("maintenance_ticket_id") REFERENCES "maintenance_tickets"("ticket_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("sale_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("sale_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_customer_device_id_fkey" FOREIGN KEY ("customer_device_id") REFERENCES "customer_devices"("device_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_requests" ADD CONSTRAINT "part_requests_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "maintenance_tickets"("ticket_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_requests" ADD CONSTRAINT "part_requests_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_requests" ADD CONSTRAINT "part_requests_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_usage" ADD CONSTRAINT "part_usage_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "maintenance_tickets"("ticket_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_usage" ADD CONSTRAINT "part_usage_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "part_requests"("request_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_usage" ADD CONSTRAINT "part_usage_sale_item_id_fkey" FOREIGN KEY ("sale_item_id") REFERENCES "sale_items"("sale_item_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_usage" ADD CONSTRAINT "part_usage_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_usage" ADD CONSTRAINT "part_usage_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;
