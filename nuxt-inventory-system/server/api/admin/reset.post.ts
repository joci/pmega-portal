import { requireAdmin } from '~/server/utils/auth'
import { getPrismaClient } from '~/server/utils/prisma'

const RESET_CONFIRMATION = 'RESET_ALL_DATA'

// TODO: Remove this endpoint once testing is complete.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ confirm?: string }>(event)

  if (body?.confirm !== RESET_CONFIRMATION) {
    throw createError({ statusCode: 400, statusMessage: 'RESET_CONFIRMATION_REQUIRED' })
  }

  const prisma = getPrismaClient()

  await prisma.$transaction(async (tx) => {
    await tx.maintenanceAttachment.deleteMany()
    await tx.partUsage.deleteMany()
    await tx.partRequest.deleteMany()

    await tx.saleAttachment.deleteMany()
    await tx.saleItem.deleteMany()
    await tx.payment.deleteMany()

    await tx.inventoryMovement.deleteMany()
    await tx.inventoryBatch.deleteMany()
    await tx.inventory.deleteMany()
    await tx.itemAttachment.deleteMany()

    await tx.sale.deleteMany()
    await tx.maintenanceTicket.deleteMany()
    await tx.customerDevice.deleteMany()
    await tx.customer.deleteMany()

    await tx.item.deleteMany()
    await tx.costSheetEntry.deleteMany()
    // Keep categories, locations, units, and settings for faster test setup.
  })

  return { ok: true }
})
