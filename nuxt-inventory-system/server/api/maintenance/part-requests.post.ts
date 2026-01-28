import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapPartRequest } from '~/server/utils/mappers'
import { requireAuthUser } from '~/server/utils/auth'

const issueInventory = async (
  tx: ReturnType<typeof getPrismaClient>,
  {
    itemId,
    locationId,
    quantity,
    referenceId,
    approvedAt,
    createdBy,
    unitPrice
  }: {
    itemId: string
    locationId: string
    quantity: number
    referenceId: string
    approvedAt: Date
    createdBy?: string | null
    unitPrice: number | null
  }
) => {
  const inventoryRow = await tx.inventory.findUnique({
    where: { item_id_location_id: { item_id: itemId, location_id: locationId } }
  })
  const onHand = Number(inventoryRow?.quantity ?? 0)
  const reserved = Number(inventoryRow?.reserved_quantity ?? 0)
  const available = onHand - reserved
  if (available < quantity) {
    throw createError({ statusCode: 409, statusMessage: 'INSUFFICIENT_STOCK' })
  }

  const batches = await tx.inventoryBatch.findMany({
    where: { item_id: itemId, location_id: locationId, quantity_remaining: { gt: 0 } },
    orderBy: { received_at: 'asc' }
  })

  let remaining = quantity
  let costTotal = 0
  let costQuantity = 0
  for (const batch of batches) {
    if (remaining <= 0) {
      break
    }
    const deduct = Math.min(batch.quantity_remaining, remaining)
    await tx.inventoryBatch.update({
      where: { batch_id: batch.batch_id },
      data: {
        quantity_remaining: batch.quantity_remaining - deduct,
        sync_status: 'SYNCED'
      }
    })
    costTotal += Number(batch.unit_cost) * deduct
    costQuantity += deduct
    remaining -= deduct
  }

  if (remaining > 0) {
    throw createError({ statusCode: 409, statusMessage: 'INSUFFICIENT_STOCK' })
  }

  await tx.inventory.upsert({
    where: { item_id_location_id: { item_id: itemId, location_id: locationId } },
    update: {
      quantity: { decrement: quantity },
      sync_status: 'SYNCED'
    },
    create: {
      inventory_id: createId(),
      item_id: itemId,
      location_id: locationId,
      quantity: 0,
      reserved_quantity: 0,
      sync_status: 'SYNCED'
    }
  })

  const unitCost = costQuantity > 0 ? costTotal / costQuantity : null

  await tx.inventoryMovement.create({
    data: {
      movement_id: createId(),
      item_id: itemId,
      location_id: locationId,
      quantity,
      movement_type: 'ISSUE',
      reference_id: referenceId,
      unit_cost: unitCost,
      unit_price: unitPrice,
      notes: 'Maintenance part request approved.',
      created_at: approvedAt,
      created_by: createdBy ?? null,
      sync_status: 'SYNCED'
    }
  })
}

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const user = await requireAuthUser(event)
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
  const requestId = body.request_id ?? createId()
  const status = String(body.status)
  if (status === 'APPROVED' && user.role !== 'admin' && user.role !== 'manager') {
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  }
  const isApproved = status === 'APPROVED'
  const approvedAt = isApproved
    ? body.approved_at
      ? new Date(body.approved_at)
      : new Date()
    : null
  const approvedBy = isApproved ? (body.approved_by ? String(body.approved_by) : user.user_id) : null

  const result = await prisma.$transaction(async (tx) => {
    if (sourcePreference === 'STORE_INVENTORY' && isApproved) {
      const itemId = body.part_id ? String(body.part_id) : ''
      if (!itemId) {
        throw createError({ statusCode: 400, statusMessage: 'PART_ID_REQUIRED' })
      }
      const item = await tx.item.findUnique({ where: { item_id: itemId } })
      if (!item) {
        throw createError({ statusCode: 404, statusMessage: 'ITEM_NOT_FOUND' })
      }
      await issueInventory(tx, {
        itemId,
        locationId: body.location_id,
        quantity: quantityRequested,
        referenceId: requestId,
        approvedAt: approvedAt ?? new Date(),
        createdBy: approvedBy,
        unitPrice: item.price != null ? Number(item.price) : null
      })
    }

    const request = await tx.partRequest.create({
      data: {
        request_id: requestId,
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
        approved_by: approvedBy,
        approved_at: approvedAt,
        status,
        source_preference: sourcePreference,
        notes: body.notes ?? null,
        location_id: body.location_id,
        sync_status: 'SYNCED'
      }
    })

    return request
  })

  return mapPartRequest(result)
})
