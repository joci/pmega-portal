import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapInventoryBatch, mapInventory, mapInventoryMovement, mapItem } from '~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const body = await readBody(event)

  if (!body?.item_id || !body?.location_id) {
    throw createError({ statusCode: 400, statusMessage: 'ITEM_AND_LOCATION_REQUIRED' })
  }

  const receivedAt = body.received_at ? new Date(body.received_at) : new Date()
  const quantityReceived = Number(body.quantity_received ?? 0)

  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({ where: { item_id: body.item_id } })
    if (!item) {
      throw createError({ statusCode: 404, statusMessage: 'ITEM_NOT_FOUND' })
    }

    const batch = await tx.inventoryBatch.create({
      data: {
        batch_id: body.batch_id ?? createId(),
        item_id: body.item_id,
        location_id: body.location_id,
        received_at: receivedAt,
        quantity_received: quantityReceived,
        quantity_remaining: quantityReceived,
        unit_cost: body.unit_cost ?? 0,
        reference: body.reference ?? null,
        sync_status: 'SYNCED'
      }
    })

    const pricingMode = item.pricing_mode ?? 'MANUAL'
    const margin = item.margin_percent ?? 0
    const nextPrice =
      pricingMode === 'MARGIN_PERCENT' ? Number(body.unit_cost ?? 0) * (1 + margin / 100) : item.price
    const priceUpdatedAt =
      pricingMode === 'MARGIN_PERCENT' && Number(item.price) !== Number(nextPrice) ? new Date() : undefined

    const updatedItem = await tx.item.update({
      where: { item_id: item.item_id },
      data: {
        cost: body.unit_cost ?? item.cost,
        price: Number.isFinite(nextPrice) ? nextPrice : item.price,
        price_updated_at: priceUpdatedAt,
        sync_status: 'SYNCED'
      }
    })

    const inventory = await tx.inventory.upsert({
      where: {
        item_id_location_id: { item_id: body.item_id, location_id: body.location_id }
      },
      update: {
        quantity: { increment: quantityReceived },
        sync_status: 'SYNCED'
      },
      create: {
        inventory_id: body.inventory_id ?? createId(),
        item_id: body.item_id,
        location_id: body.location_id,
        quantity: quantityReceived,
        reserved_quantity: 0,
        sync_status: 'SYNCED'
      }
    })

    const movement = await tx.inventoryMovement.create({
      data: {
        movement_id: createId(),
        item_id: body.item_id,
        location_id: body.location_id,
        quantity: quantityReceived,
        movement_type: 'RECEIPT',
        reference_id: body.reference ?? batch.batch_id,
        unit_cost: body.unit_cost ?? 0,
        created_at: receivedAt,
        sync_status: 'SYNCED'
      }
    })

    return { batch, item: updatedItem, inventory, movement }
  })

  return {
    batch: mapInventoryBatch(result.batch),
    item: mapItem(result.item),
    inventory: mapInventory(result.inventory),
    movement: mapInventoryMovement(result.movement)
  }
})
