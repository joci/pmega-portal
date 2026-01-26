import { getPrismaClient } from '~/server/utils/prisma'
import { getRolePermissions } from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const role = String(config.appRole || 'viewer').toLowerCase()
  const permissions = getRolePermissions(role)
  if (!permissions.includes('inventory.locations.manage')) {
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  }

  const prisma = getPrismaClient()
  const locationId = event.context.params?.locationId
  if (!locationId) {
    throw createError({ statusCode: 400, statusMessage: 'LOCATION_ID_REQUIRED' })
  }

  const [itemCount, inventoryCount, batchCount, saleCount, ticketCount, requestCount, usageCount] =
    await prisma.$transaction([
      prisma.item.count({ where: { location_id: locationId } }),
      prisma.inventory.count({ where: { location_id: locationId } }),
      prisma.inventoryBatch.count({ where: { location_id: locationId } }),
      prisma.sale.count({ where: { location_id: locationId } }),
      prisma.maintenanceTicket.count({ where: { location_id: locationId } }),
      prisma.partRequest.count({ where: { location_id: locationId } }),
      prisma.partUsage.count({ where: { location_id: locationId } })
    ])

  if (itemCount + inventoryCount + batchCount + saleCount + ticketCount + requestCount + usageCount > 0) {
    throw createError({ statusCode: 409, statusMessage: 'LOCATION_IN_USE' })
  }

  await prisma.location.delete({ where: { location_id: locationId } })

  return { ok: true }
})
