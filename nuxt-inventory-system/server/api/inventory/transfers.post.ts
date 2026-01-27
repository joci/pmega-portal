import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapInventory, mapInventoryBatch, mapInventoryMovement } from '~/server/utils/mappers'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  if (!body?.item_id || !body?.from_location_id || !body?.to_location_id) {
    throw createError({ statusCode: 400, statusMessage: 'TRANSFER_FIELDS_REQUIRED' })
  }

  const quantity = Number(body.quantity ?? 0)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'TRANSFER_QUANTITY_REQUIRED' })
  }

  if (body.from_location_id === body.to_location_id) {
    throw createError({ statusCode: 400, statusMessage: 'TRANSFER_LOCATION_INVALID' })
  }

  const transferredAt = body.transferred_at ? new Date(body.transferred_at) : new Date()
  if (Number.isNaN(transferredAt.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'TRANSFER_DATE_INVALID' })
  }

  const transferId = body.transfer_id ?? createId()
  const notes = typeof body.notes === 'string' ? body.notes.trim() : ''
  const employeeName = typeof body.employee_name === 'string' ? body.employee_name.trim() : ''
  const normalizedEmployeeName = employeeName || null
  if (!normalizedEmployeeName) {
    throw createError({ statusCode: 400, statusMessage: 'TRANSFER_EMPLOYEE_REQUIRED' })
  }
  const transferReference =
    typeof body.reference === 'string' && body.reference.trim()
      ? `Transfer ${transferId} - ${body.reference.trim()}`
      : `Transfer ${transferId}`
  const attachmentDataUrl = typeof body.attachment_data_url === 'string' ? body.attachment_data_url : ''
  const attachmentFileName = typeof body.attachment_file_name === 'string' ? body.attachment_file_name : ''
  const attachmentFileType = typeof body.attachment_file_type === 'string' ? body.attachment_file_type : ''
  const attachmentFileSize = Number(body.attachment_file_size ?? 0)
  if (attachmentFileSize > 5 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: 'TRANSFER_ATTACHMENT_TOO_LARGE' })
  }

  const normalizedNotes = notes ? notes : null
  const normalizedAttachment = attachmentDataUrl
    ? {
        attachment_data_url: attachmentDataUrl,
        attachment_file_name: attachmentFileName || null,
        attachment_file_type: attachmentFileType || null,
        attachment_file_size: attachmentFileSize || null
      }
    : {
        attachment_data_url: null,
        attachment_file_name: null,
        attachment_file_type: null,
        attachment_file_size: null
      }

  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({ where: { item_id: body.item_id } })
    if (!item) {
      throw createError({ statusCode: 404, statusMessage: 'ITEM_NOT_FOUND' })
    }

    const sourceInventoryRow = await tx.inventory.findUnique({
      where: {
        item_id_location_id: { item_id: body.item_id, location_id: body.from_location_id }
      }
    })
    const available = (sourceInventoryRow?.quantity ?? 0) - (sourceInventoryRow?.reserved_quantity ?? 0)
    if (available < quantity) {
      throw createError({ statusCode: 409, statusMessage: 'INSUFFICIENT_STOCK' })
    }

    const batches = await tx.inventoryBatch.findMany({
      where: {
        item_id: body.item_id,
        location_id: body.from_location_id,
        quantity_remaining: { gt: 0 }
      },
      orderBy: { received_at: 'asc' }
    })

    let remaining = quantity
    let costTotal = 0
    let costQuantity = 0
    const createdBatches = []
    const updatedBatches = []

    for (const batch of batches) {
      if (remaining <= 0) {
        break
      }
      const deduct = Math.min(batch.quantity_remaining, remaining)

      const updatedBatch = await tx.inventoryBatch.update({
        where: { batch_id: batch.batch_id },
        data: {
          quantity_remaining: batch.quantity_remaining - deduct,
          updated_by: user.user_id,
          sync_status: 'SYNCED'
        }
      })
      updatedBatches.push(updatedBatch)

      createdBatches.push(
        await tx.inventoryBatch.create({
          data: {
            batch_id: createId(),
            item_id: body.item_id,
          location_id: body.to_location_id,
          received_at: transferredAt,
          quantity_received: deduct,
          quantity_remaining: deduct,
          unit_cost: batch.unit_cost,
            reference: transferReference,
            created_by: user.user_id,
            sync_status: 'SYNCED'
          }
        })
      )

      costTotal += Number(batch.unit_cost) * deduct
      costQuantity += deduct
      remaining -= deduct
    }

    if (remaining > 0) {
      throw createError({ statusCode: 409, statusMessage: 'INSUFFICIENT_STOCK' })
    }

    const [sourceInventory, destinationInventory] = await Promise.all([
      tx.inventory.upsert({
        where: {
          item_id_location_id: { item_id: body.item_id, location_id: body.from_location_id }
        },
      update: {
        quantity: { decrement: quantity },
        updated_by: user.user_id,
        sync_status: 'SYNCED'
      },
      create: {
        inventory_id: createId(),
        item_id: body.item_id,
        location_id: body.from_location_id,
        quantity: 0,
        reserved_quantity: 0,
        created_by: user.user_id,
        sync_status: 'SYNCED'
      }
    }),
      tx.inventory.upsert({
        where: {
          item_id_location_id: { item_id: body.item_id, location_id: body.to_location_id }
        },
      update: {
        quantity: { increment: quantity },
        updated_by: user.user_id,
        sync_status: 'SYNCED'
      },
      create: {
        inventory_id: createId(),
        item_id: body.item_id,
        location_id: body.to_location_id,
        quantity,
        reserved_quantity: 0,
        created_by: user.user_id,
        sync_status: 'SYNCED'
      }
    })
  ])

    const unitCost = costQuantity > 0 ? costTotal / costQuantity : null

    const [movementOut, movementIn] = await Promise.all([
      tx.inventoryMovement.create({
        data: {
          movement_id: createId(),
          item_id: body.item_id,
          location_id: body.from_location_id,
          quantity,
          movement_type: 'TRANSFER_OUT',
          reference_id: transferId,
          unit_cost: unitCost,
          notes: normalizedNotes,
          employee_name: normalizedEmployeeName,
          ...normalizedAttachment,
          created_at: transferredAt,
          created_by: user.user_id,
          sync_status: 'SYNCED'
        }
      }),
      tx.inventoryMovement.create({
        data: {
          movement_id: createId(),
          item_id: body.item_id,
          location_id: body.to_location_id,
          quantity,
          movement_type: 'TRANSFER_IN',
          reference_id: transferId,
          unit_cost: unitCost,
          notes: normalizedNotes,
          employee_name: normalizedEmployeeName,
          ...normalizedAttachment,
          created_at: transferredAt,
          created_by: user.user_id,
          sync_status: 'SYNCED'
        }
      })
    ])

    return {
      transferId,
      movementOut,
      movementIn,
      createdBatches,
      updatedBatches,
      sourceInventory,
      destinationInventory
    }
  })

  return {
    transfer_id: result.transferId,
    movement_out: mapInventoryMovement(result.movementOut),
    movement_in: mapInventoryMovement(result.movementIn),
    batches: result.createdBatches.map(mapInventoryBatch),
    updated_batches: result.updatedBatches.map(mapInventoryBatch),
    inventory: [mapInventory(result.sourceInventory), mapInventory(result.destinationInventory)]
  }
})
