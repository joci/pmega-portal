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

const returnInventory = async (
  tx: ReturnType<typeof getPrismaClient>,
  {
    itemId,
    locationId,
    quantity,
    referenceId,
    createdBy
  }: {
    itemId: string
    locationId: string
    quantity: number
    referenceId: string
    createdBy?: string | null
  }
) => {
  if (quantity <= 0) {
    return
  }
  const issueMovements = await tx.inventoryMovement.findMany({
    where: { reference_id: referenceId, movement_type: 'ISSUE', item_id: itemId }
  })
  let costTotal = 0
  let costQuantity = 0
  let priceTotal = 0
  let priceQuantity = 0

  for (const movement of issueMovements) {
    const qty = Number(movement.quantity ?? 0)
    if (movement.unit_cost != null) {
      costTotal += Number(movement.unit_cost) * qty
      costQuantity += qty
    }
    if (movement.unit_price != null) {
      priceTotal += Number(movement.unit_price) * qty
      priceQuantity += qty
    }
  }

  const unitCost = costQuantity > 0 ? costTotal / costQuantity : null
  const unitPrice = priceQuantity > 0 ? priceTotal / priceQuantity : null

  await tx.inventoryBatch.create({
    data: {
      batch_id: createId(),
      item_id: itemId,
      location_id: locationId,
      received_at: new Date(),
      quantity_received: quantity,
      quantity_remaining: quantity,
      unit_cost: unitCost ?? 0,
      reference: `Part request reversal ${referenceId}`,
      created_by: createdBy ?? null,
      sync_status: 'SYNCED'
    }
  })

  await tx.inventory.upsert({
    where: { item_id_location_id: { item_id: itemId, location_id: locationId } },
    update: {
      quantity: { increment: quantity },
      sync_status: 'SYNCED'
    },
    create: {
      inventory_id: createId(),
      item_id: itemId,
      location_id: locationId,
      quantity,
      reserved_quantity: 0,
      sync_status: 'SYNCED'
    }
  })

  await tx.inventoryMovement.create({
    data: {
      movement_id: createId(),
      item_id: itemId,
      location_id: locationId,
      quantity,
      movement_type: 'ADJUSTMENT',
      reference_id: referenceId,
      unit_cost: unitCost,
      unit_price: unitPrice,
      notes: 'Maintenance part request approval reversed.',
      created_at: new Date(),
      created_by: createdBy ?? null,
      sync_status: 'SYNCED'
    }
  })
}

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const user = await requireAuthUser(event)
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

  const existing = await prisma.partRequest.findUnique({ where: { request_id: requestId } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'REQUEST_NOT_FOUND' })
  }

  const nextStatus = body.status ? String(body.status) : existing.status
  const nextSource = body.source_preference ? String(body.source_preference) : existing.source_preference
  const nextPartId = body.part_id === null ? null : body.part_id ?? existing.part_id
  const nextQuantity = quantityRequested ?? Number(existing.quantity_requested)
  if (nextStatus !== existing.status && (nextStatus === 'APPROVED' || existing.status === 'APPROVED')) {
    if (user.role !== 'admin' && user.role !== 'manager') {
      throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
    }
  }

  const approvedAt =
    nextStatus === 'APPROVED'
      ? body.approved_at
        ? new Date(body.approved_at)
        : existing.approved_at ?? new Date()
      : null
  const approvedBy =
    nextStatus === 'APPROVED'
      ? body.approved_by
        ? String(body.approved_by)
        : user.user_id
      : null

  if (
    existing.status === 'APPROVED' &&
    nextStatus === 'APPROVED' &&
    (nextQuantity !== Number(existing.quantity_requested) ||
      nextPartId !== existing.part_id ||
      nextSource !== existing.source_preference)
  ) {
    throw createError({ statusCode: 409, statusMessage: 'REQUEST_APPROVED_LOCKED' })
  }

  const shouldIssue =
    nextSource === 'STORE_INVENTORY' && nextStatus === 'APPROVED' && existing.status !== 'APPROVED'
  const shouldReturn =
    existing.source_preference === 'STORE_INVENTORY' && existing.status === 'APPROVED' && nextStatus !== 'APPROVED'

  const result = await prisma.$transaction(async (tx) => {
    if (shouldIssue) {
      const itemId = nextPartId ? String(nextPartId) : ''
      if (!itemId) {
        throw createError({ statusCode: 400, statusMessage: 'PART_ID_REQUIRED' })
      }
      const item = await tx.item.findUnique({ where: { item_id: itemId } })
      if (!item) {
        throw createError({ statusCode: 404, statusMessage: 'ITEM_NOT_FOUND' })
      }
      await issueInventory(tx, {
        itemId,
        locationId: existing.location_id,
        quantity: nextQuantity,
        referenceId: requestId,
        approvedAt: approvedAt ?? new Date(),
        createdBy: approvedBy ?? null,
        unitPrice: item.price != null ? Number(item.price) : null
      })
    }
    if (shouldReturn) {
      const itemId = existing.part_id ? String(existing.part_id) : ''
      if (!itemId) {
        throw createError({ statusCode: 400, statusMessage: 'PART_ID_REQUIRED' })
      }
      await returnInventory(tx, {
        itemId,
        locationId: existing.location_id,
        quantity: Number(existing.quantity_requested),
        referenceId: requestId,
        createdBy: user.user_id
      })
    }

    const request = await tx.partRequest.update({
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
        approved_by: approvedBy,
        approved_at: approvedAt,
        status: nextStatus,
        source_preference: body.source_preference ?? undefined,
        technician_id: body.technician_id ?? undefined,
        notes: body.notes ?? undefined,
        sync_status: 'SYNCED'
      }
    })

    return request
  })

  return mapPartRequest(result)
})
