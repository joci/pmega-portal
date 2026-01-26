import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapPartRequest } from '~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const body = await readBody(event)

  if (!body?.ticket_id || !body?.customer_device_id || !body?.requested_by || !body?.location_id) {
    throw createError({ statusCode: 400, statusMessage: 'REQUEST_FIELDS_REQUIRED' })
  }
  if (!body?.status || !body?.source_preference) {
    throw createError({ statusCode: 400, statusMessage: 'REQUEST_STATUS_REQUIRED' })
  }
  if (!body?.technician_id) {
    throw createError({ statusCode: 400, statusMessage: 'TECHNICIAN_REQUIRED' })
  }

  const sourcePreference = String(body.source_preference)
  if (sourcePreference === 'EXTERNAL_SUPPLIER') {
    if (!body?.external_item_name || !body?.external_receipt_number) {
      throw createError({ statusCode: 400, statusMessage: 'EXTERNAL_FIELDS_REQUIRED' })
    }
    const externalCost = Number(body.external_cost ?? 0)
    if (externalCost <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'EXTERNAL_COST_REQUIRED' })
    }
  } else if (!body?.part_id) {
    throw createError({ statusCode: 400, statusMessage: 'REQUEST_FIELDS_REQUIRED' })
  }

  const quantityRequested = Number(body.quantity_requested ?? 0)
  if (quantityRequested <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'QUANTITY_REQUIRED' })
  }

  const externalCostValue =
    body.external_cost === undefined || body.external_cost === null ? null : Number(body.external_cost)

  const request = await prisma.partRequest.create({
    data: {
      request_id: body.request_id ?? createId(),
      ticket_id: body.ticket_id,
      customer_device_id: body.customer_device_id,
      part_id: body.part_id ? String(body.part_id) : null,
      external_item_name: body.external_item_name ? String(body.external_item_name) : null,
      external_model: body.external_model ? String(body.external_model) : null,
      external_cost: externalCostValue,
      external_receipt_number: body.external_receipt_number ? String(body.external_receipt_number) : null,
      external_receipt_data_url: body.external_receipt_data_url ? String(body.external_receipt_data_url) : null,
      external_receipt_file_name: body.external_receipt_file_name ? String(body.external_receipt_file_name) : null,
      external_receipt_file_type: body.external_receipt_file_type ? String(body.external_receipt_file_type) : null,
      external_receipt_file_size:
        body.external_receipt_file_size === undefined || body.external_receipt_file_size === null
          ? null
          : Number(body.external_receipt_file_size),
      quantity_requested: quantityRequested,
      requested_by: body.requested_by,
      technician_id: body.technician_id ?? null,
      requested_at: body.requested_at ? new Date(body.requested_at) : new Date(),
      approved_by: body.approved_by ?? null,
      approved_at: body.approved_at ? new Date(body.approved_at) : null,
      status: body.status,
      source_preference: sourcePreference,
      notes: body.notes ?? null,
      location_id: body.location_id,
      sync_status: 'SYNCED'
    }
  })

  return mapPartRequest(request)
})
