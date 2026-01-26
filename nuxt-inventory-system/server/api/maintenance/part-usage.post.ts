import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapPartUsage } from '~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const body = await readBody(event)

  if (!body?.ticket_id || !body?.part_id || !body?.location_id || !body?.source) {
    throw createError({ statusCode: 400, statusMessage: 'USAGE_FIELDS_REQUIRED' })
  }

  const quantityUsed = Number(body.quantity_used ?? 0)
  const unitCost = Number(body.unit_cost ?? 0)
  if (quantityUsed <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'QUANTITY_REQUIRED' })
  }

  const totalCost = body.total_cost ?? quantityUsed * unitCost

  const usage = await prisma.partUsage.create({
    data: {
      usage_id: body.usage_id ?? createId(),
      ticket_id: body.ticket_id,
      request_id: body.request_id ?? null,
      sale_item_id: body.sale_item_id ?? null,
      part_id: body.part_id,
      quantity_used: quantityUsed,
      unit_cost: unitCost,
      total_cost: totalCost,
      source: body.source,
      external_supplier_id: body.external_supplier_id ?? null,
      external_reference: body.external_reference ?? null,
      used_by: body.used_by ?? null,
      used_at: body.used_at ? new Date(body.used_at) : null,
      notes: body.notes ?? null,
      location_id: body.location_id,
      sync_status: 'SYNCED'
    }
  })

  return mapPartUsage(usage)
})
