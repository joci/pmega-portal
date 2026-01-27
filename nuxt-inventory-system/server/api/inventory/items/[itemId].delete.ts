import { getPrismaClient } from '~/server/utils/prisma'
import { getRolePermissions } from '~/utils/permissions'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const itemId = event.context.params?.itemId
  if (!itemId) {
    throw createError({ statusCode: 400, statusMessage: 'ITEM_ID_REQUIRED' })
  }

  const user = await requireAuthUser(event)
  const role = String(user.role || 'viewer').toLowerCase()
  const permissions = getRolePermissions(role)

  const item = await prisma.item.findUnique({
    where: { item_id: itemId },
    select: { item_id: true, cost_sheet_entry_id: true }
  })
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'ITEM_NOT_FOUND' })
  }
  if (item.cost_sheet_entry_id && !permissions.includes('inventory.cost_sheet.remove')) {
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  }

  const saleItemCount = await prisma.saleItem.count({ where: { item_id: itemId } })
  if (saleItemCount > 0) {
    throw createError({ statusCode: 409, statusMessage: 'ITEM_IN_USE' })
  }

  await prisma.$transaction([
    prisma.itemAttachment.deleteMany({ where: { item_id: itemId } }),
    prisma.inventoryBatch.deleteMany({ where: { item_id: itemId } }),
    prisma.inventory.deleteMany({ where: { item_id: itemId } }),
    prisma.item.delete({ where: { item_id: itemId } })
  ])

  return { ok: true }
})
