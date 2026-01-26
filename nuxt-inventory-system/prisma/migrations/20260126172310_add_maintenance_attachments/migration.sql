-- CreateTable
CREATE TABLE "maintenance_attachments" (
    "attachment_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "data_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'SYNCED',

    CONSTRAINT "maintenance_attachments_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateIndex
CREATE INDEX "maintenance_attachments_ticket_id_idx" ON "maintenance_attachments"("ticket_id");

-- AddForeignKey
ALTER TABLE "maintenance_attachments" ADD CONSTRAINT "maintenance_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "maintenance_tickets"("ticket_id") ON DELETE RESTRICT ON UPDATE CASCADE;
