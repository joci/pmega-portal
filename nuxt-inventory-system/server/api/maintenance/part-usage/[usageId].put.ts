import { getPrismaClient } from '~/server/utils/prisma'
import { mapPartUsage } from '~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const usageId = event.context.params?.usageId
  if (!usageId) {
    throw createError({ statusCode: 400, statusMessage: 'USAGE_ID_REQUIRED' })
  }

  const body = await readBody(event)
  const quantityUsed = body.quantity_used === undefined ? undefined : Number(body.quantity_used)
  const unitCost = body.unit_cost === undefined ? undefined : Number(body.unit_cost)

  if (quantityUsed !== undefined && quantityUsed <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'QUANTITY_REQUIRED' })
  }

  const totalCost =
    body.total_cost ??
    (quantityUsed !== undefined && unitCost !== undefined ? quantityUsed * unitCost : undefined)

  const usage = await prisma.partUsage.update({
    where: { usage_id: usageId },
    data: {
      quantity_used: quantityUsed,
      unit_cost: unitCost,
      total_cost: totalCost,
      source: body.source ?? undefined,
      external_supplier_id: body.external_supplier_id ?? undefined,
      external_reference: body.external_reference ?? undefined,
      used_by: body.used_by ?? undefined,
      used_at: body.used_at ? new Date(body.used_at) : undefined,
      notes: body.notes ?? undefined,
      sync_status: 'SYNCED'
    }
  })

  return mapPartUsage(usage)
})
