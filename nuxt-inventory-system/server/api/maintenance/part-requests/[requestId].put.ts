import { getPrismaClient } from '~/server/utils/prisma'
import { mapPartRequest } from '~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const requestId = event.context.params?.requestId
  if (!requestId) {
    throw createError({ statusCode: 400, statusMessage: 'REQUEST_ID_REQUIRED' })
  }

  const body = await readBody(event)
  const quantityRequested =
    body.quantity_requested === undefined ? undefined : Number(body.quantity_requested)
  const externalCost =
    body.external_cost === undefined || body.external_cost === null ? undefined : Number(body.external_cost)

  if (quantityRequested !== undefined && quantityRequested <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'QUANTITY_REQUIRED' })
  }
  if (externalCost !== undefined && externalCost <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'EXTERNAL_COST_REQUIRED' })
  }

  const request = await prisma.partRequest.update({
    where: { request_id: requestId },
    data: {
      customer_device_id: body.customer_device_id ?? undefined,
      part_id: body.part_id === null ? null : body.part_id ?? undefined,
      external_item_name: body.external_item_name ?? undefined,
      external_model: body.external_model ?? undefined,
      external_cost: externalCost,
      external_receipt_number: body.external_receipt_number ?? undefined,
      external_receipt_data_url: body.external_receipt_data_url ?? undefined,
      external_receipt_file_name: body.external_receipt_file_name ?? undefined,
      external_receipt_file_type: body.external_receipt_file_type ?? undefined,
      external_receipt_file_size:
        body.external_receipt_file_size === undefined ? undefined : Number(body.external_receipt_file_size),
      quantity_requested: quantityRequested,
      approved_by: body.approved_by ?? undefined,
      approved_at: body.approved_at ? new Date(body.approved_at) : undefined,
      status: body.status ?? undefined,
      source_preference: body.source_preference ?? undefined,
      technician_id: body.technician_id ?? undefined,
      notes: body.notes ?? undefined,
      sync_status: 'SYNCED'
    }
  })

  return mapPartRequest(request)
})
