import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapSale, mapSaleAttachment, mapSaleItem } from '~/server/utils/mappers'
import { requireAuthUser } from '~/server/utils/auth'

type SalePayload = {
  sale: Record<string, unknown>
  items: Array<Record<string, unknown>>
  attachments?: Array<Record<string, unknown>>
}

const buildRequiredByItem = (items: Array<{ item_id?: string | null; affects_inventory?: boolean; quantity?: number }>) => {
  const map = new Map<string, number>()
  for (const item of items) {
    if (!item.affects_inventory || !item.item_id) {
      continue
    }
    const quantity = Number(item.quantity ?? 0)
    map.set(item.item_id, (map.get(item.item_id) ?? 0) + quantity)
  }
  return map
}

const buildPriceByItem = (
  items: Array<{ item_id?: string | null; affects_inventory?: boolean; quantity?: number; line_total?: number }>
) => {
  const map = new Map<string, { total: number; quantity: number }>()
  for (const item of items) {
    if (!item.affects_inventory || !item.item_id) {
      continue
    }
    const quantity = Number(item.quantity ?? 0)
    const lineTotal = Number(item.line_total ?? 0)
    const current = map.get(item.item_id) ?? { total: 0, quantity: 0 }
    current.total += lineTotal
    current.quantity += quantity
    map.set(item.item_id, current)
  }
  return map
}

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const user = await requireAuthUser(event)
  const saleId = getRouterParam(event, 'saleId')
  const body = (await readBody(event)) as SalePayload

  if (!saleId) {
    throw createError({ statusCode: 400, statusMessage: 'SALE_ID_REQUIRED' })
  }

  if (!body?.sale || !Array.isArray(body.items)) {
    throw createError({ statusCode: 400, statusMessage: 'SALE_PAYLOAD_REQUIRED' })
  }

  const existing = await prisma.sale.findUnique({
    where: { sale_id: saleId },
    include: { items: true }
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'SALE_NOT_FOUND' })
  }

  if (existing.status === 'COMPLETED' && user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'SALE_LOCKED' })
  }

  const saleData = body.sale
  const existingStatus = existing.status
  const nextStatus = String(saleData.status ?? existing.status)
  const receiptNumber = saleData.receipt_number ? String(saleData.receipt_number).trim() : ''
  const paymentMethod = saleData.payment_method ? String(saleData.payment_method) : ''
  const locationId = saleData.location_id ? String(saleData.location_id) : ''

  if (!locationId) {
    throw createError({ statusCode: 400, statusMessage: 'LOCATION_REQUIRED' })
  }
  if (!receiptNumber) {
    throw createError({ statusCode: 400, statusMessage: 'RECEIPT_NUMBER_REQUIRED' })
  }
  if (!paymentMethod) {
    throw createError({ statusCode: 400, statusMessage: 'PAYMENT_METHOD_REQUIRED' })
  }

  if (locationId !== existing.location_id) {
    throw createError({ statusCode: 409, statusMessage: 'LOCATION_LOCKED' })
  }

  const normalizedItems = body.items.map((entry) => {
    const quantity = Number(entry.quantity ?? 0)
    const unitPrice = Number(entry.unit_price ?? 0)
    const lineTotal = quantity * unitPrice
    return {
      sale_item_id: (entry.sale_item_id as string) || createId(),
      sale_id: saleId,
      item_id: entry.item_id ? String(entry.item_id) : null,
      description: entry.description ? String(entry.description) : null,
      line_type: String(entry.line_type),
      quantity,
      unit_price: unitPrice,
      discount_amount: Number(entry.discount_amount ?? 0),
      tax_amount: Number(entry.tax_amount ?? 0),
      line_total: lineTotal,
      affects_inventory:
        typeof entry.affects_inventory === 'boolean'
          ? entry.affects_inventory
          : ['PRODUCT', 'SPARE_PART'].includes(String(entry.line_type)) && Boolean(entry.item_id)
    }
  })

  const existingRequiredByItem = buildRequiredByItem(
    existing.items.map((item) => ({
      item_id: item.item_id ?? null,
      affects_inventory: item.affects_inventory,
      quantity: Number(item.quantity)
    }))
  )
  const incomingRequiredByItem = buildRequiredByItem(
    normalizedItems.map((item) => ({
      item_id: item.item_id ?? null,
      affects_inventory: item.affects_inventory,
      quantity: item.quantity
    }))
  )
  const priceByItem = buildPriceByItem(
    normalizedItems.map((item) => ({
      item_id: item.item_id ?? null,
      affects_inventory: item.affects_inventory,
      quantity: item.quantity,
      line_total: item.line_total
    }))
  )

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.line_total, 0)
  const discount = Number(saleData.discount_amount ?? 0)
  const tax = Number(saleData.tax_amount ?? 0)
  const total = subtotal - discount + tax

  const saleDate = saleData.sale_date ? new Date(String(saleData.sale_date)) : existing.sale_date
  const canEditEmployee = user.role === 'admin'
  const hasPerformedBy = Object.prototype.hasOwnProperty.call(saleData ?? {}, 'performed_by')
  const requestedEmployee =
    typeof saleData.performed_by === 'string' ? String(saleData.performed_by).trim() : ''
  const performedBy =
    canEditEmployee && hasPerformedBy ? (requestedEmployee ? requestedEmployee : null) : existing.performed_by

  const rawAttachments = Array.isArray((body as { attachments?: unknown[] })?.attachments)
    ? (body as { attachments: unknown[] }).attachments
    : []
  const attachments = rawAttachments
    .map((entry) => ({
      data_url: typeof (entry as { data_url?: unknown }).data_url === 'string'
        ? String((entry as { data_url?: string }).data_url)
        : '',
      file_name: typeof (entry as { file_name?: unknown }).file_name === 'string'
        ? String((entry as { file_name?: string }).file_name)
        : '',
      file_type: typeof (entry as { file_type?: unknown }).file_type === 'string'
        ? String((entry as { file_type?: string }).file_type)
        : '',
      file_size: Number((entry as { file_size?: unknown }).file_size ?? 0)
    }))
    .filter((entry) => entry.data_url && entry.file_name)

  for (const attachment of attachments) {
    if (attachment.file_size > 5 * 1024 * 1024) {
      throw createError({ statusCode: 400, statusMessage: 'ATTACHMENT_TOO_LARGE' })
    }
  }

  const movementCostByItem = new Map<
    string,
    { costTotal: number; costQuantity: number; priceTotal: number; priceQuantity: number }
  >()
  if (existingStatus === 'COMPLETED' && existingRequiredByItem.size > 0) {
    const movements = await prisma.inventoryMovement.findMany({
      where: { reference_id: saleId, movement_type: 'SALE' }
    })
    for (const movement of movements) {
      const current = movementCostByItem.get(movement.item_id) ?? {
        costTotal: 0,
        costQuantity: 0,
        priceTotal: 0,
        priceQuantity: 0
      }
      const quantity = Number(movement.quantity ?? 0)
      if (movement.unit_cost != null) {
        current.costTotal += Number(movement.unit_cost) * quantity
        current.costQuantity += quantity
      }
      if (movement.unit_price != null) {
        current.priceTotal += Number(movement.unit_price) * quantity
        current.priceQuantity += quantity
      }
      movementCostByItem.set(movement.item_id, current)
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const allItemIds = new Set<string>([
      ...Array.from(existingRequiredByItem.keys()),
      ...Array.from(incomingRequiredByItem.keys())
    ])
    const inventoryState = new Map<string, { quantity: number; reserved: number; exists: boolean }>()

    if (allItemIds.size > 0) {
      const inventoryRows = await tx.inventory.findMany({
        where: { location_id: locationId, item_id: { in: Array.from(allItemIds) } }
      })
      for (const row of inventoryRows) {
        inventoryState.set(row.item_id, {
          quantity: Number(row.quantity ?? 0),
          reserved: Number(row.reserved_quantity ?? 0),
          exists: true
        })
      }
    }

    const getState = (itemId: string) => {
      const existingState = inventoryState.get(itemId)
      if (existingState) {
        return existingState
      }
      const nextState = { quantity: 0, reserved: 0, exists: false }
      inventoryState.set(itemId, nextState)
      return nextState
    }

    const applyInventoryUpdate = async (itemId: string, quantityDelta: number, reservedDelta: number) => {
      const state = getState(itemId)
      const nextQuantity = state.quantity + quantityDelta
      const nextReserved = state.reserved + reservedDelta
      if (nextQuantity < 0 || nextReserved < 0) {
        throw createError({ statusCode: 409, statusMessage: 'INSUFFICIENT_STOCK' })
      }
      if (!state.exists && (quantityDelta < 0 || reservedDelta < 0)) {
        throw createError({ statusCode: 409, statusMessage: 'INSUFFICIENT_STOCK' })
      }

      state.quantity = nextQuantity
      state.reserved = nextReserved
      state.exists = true

      await tx.inventory.upsert({
        where: { item_id_location_id: { item_id: itemId, location_id: locationId } },
        update: {
          ...(quantityDelta !== 0 ? { quantity: { increment: quantityDelta } } : {}),
          ...(reservedDelta !== 0 ? { reserved_quantity: { increment: reservedDelta } } : {}),
          updated_by: user.user_id,
          sync_status: 'SYNCED'
        },
        create: {
          inventory_id: createId(),
          item_id: itemId,
          location_id: locationId,
          quantity: Math.max(quantityDelta, 0),
          reserved_quantity: Math.max(reservedDelta, 0),
          created_by: user.user_id,
          sync_status: 'SYNCED'
        }
      })
    }

    const applyReserveDelta = async (itemId: string, delta: number) => {
      if (delta === 0) {
        return
      }
      const state = getState(itemId)
      if (delta > 0) {
        const available = state.quantity - state.reserved
        if (available < delta) {
          throw createError({ statusCode: 409, statusMessage: 'INSUFFICIENT_STOCK' })
        }
      }
      await applyInventoryUpdate(itemId, 0, delta)
    }

    const applyConsume = async (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        return
      }
      const state = getState(itemId)
      const available = state.quantity - state.reserved
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

      await applyInventoryUpdate(itemId, -quantity, 0)

      const priceEntry = priceByItem.get(itemId)
      const unitPrice =
        priceEntry && priceEntry.quantity > 0 ? priceEntry.total / priceEntry.quantity : null
      const unitCost = costQuantity > 0 ? costTotal / costQuantity : null

      await tx.inventoryMovement.create({
        data: {
          movement_id: createId(),
          item_id: itemId,
          location_id: locationId,
          quantity,
          movement_type: 'SALE',
          reference_id: saleId,
          unit_cost: unitCost,
          unit_price: unitPrice,
          created_at: saleDate,
          created_by: user.user_id,
          sync_status: 'SYNCED'
        }
      })
    }

    const applyReturn = async (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        return
      }
      const movementCost = movementCostByItem.get(itemId)
      const unitCost =
        movementCost && movementCost.costQuantity > 0
          ? movementCost.costTotal / movementCost.costQuantity
          : null
      const unitPrice =
        movementCost && movementCost.priceQuantity > 0
          ? movementCost.priceTotal / movementCost.priceQuantity
          : null

      await tx.inventoryBatch.create({
        data: {
          batch_id: createId(),
          item_id: itemId,
          location_id: locationId,
          received_at: new Date(),
          quantity_received: quantity,
          quantity_remaining: quantity,
          unit_cost: unitCost ?? 0,
          reference: `Sale edit ${saleId}`,
          created_by: user.user_id,
          sync_status: 'SYNCED'
        }
      })

      await applyInventoryUpdate(itemId, quantity, 0)

      await tx.inventoryMovement.create({
        data: {
          movement_id: createId(),
          item_id: itemId,
          location_id: locationId,
          quantity,
          movement_type: 'ADJUSTMENT',
          reference_id: saleId,
          unit_cost: unitCost,
          unit_price: unitPrice,
          notes: 'Sale line item update reversal.',
          created_at: new Date(),
          created_by: user.user_id,
          sync_status: 'SYNCED'
        }
      })
    }

    const shouldReserveExisting = existingStatus === 'OPEN'
    const shouldConsumeExisting = existingStatus === 'COMPLETED'
    const shouldReserveNext = nextStatus === 'OPEN'
    const shouldConsumeNext = nextStatus === 'COMPLETED'

    if (shouldReserveExisting && shouldReserveNext) {
      for (const itemId of allItemIds) {
        const delta = (incomingRequiredByItem.get(itemId) ?? 0) - (existingRequiredByItem.get(itemId) ?? 0)
        await applyReserveDelta(itemId, delta)
      }
    } else {
      if (shouldReserveExisting && !shouldReserveNext) {
        for (const [itemId, quantity] of existingRequiredByItem.entries()) {
          await applyReserveDelta(itemId, -quantity)
        }
      }
      if (!shouldReserveExisting && shouldReserveNext) {
        for (const [itemId, quantity] of incomingRequiredByItem.entries()) {
          await applyReserveDelta(itemId, quantity)
        }
      }
    }

    if (shouldConsumeExisting && shouldConsumeNext) {
      for (const itemId of allItemIds) {
        const delta = (incomingRequiredByItem.get(itemId) ?? 0) - (existingRequiredByItem.get(itemId) ?? 0)
        if (delta > 0) {
          await applyConsume(itemId, delta)
        } else if (delta < 0) {
          await applyReturn(itemId, Math.abs(delta))
        }
      }
    } else {
      if (shouldConsumeExisting && !shouldConsumeNext) {
        for (const [itemId, quantity] of existingRequiredByItem.entries()) {
          await applyReturn(itemId, quantity)
        }
      }
      if (!shouldConsumeExisting && shouldConsumeNext) {
        for (const [itemId, quantity] of incomingRequiredByItem.entries()) {
          await applyConsume(itemId, quantity)
        }
      }
    }

    const updatedSale = await tx.sale.update({
      where: { sale_id: saleId },
      data: {
        receipt_number: receiptNumber,
        sale_date: saleDate,
        sale_type: String(saleData.sale_type ?? existing.sale_type),
        status: nextStatus,
        payment_status: String(saleData.payment_status ?? existing.payment_status),
        payment_method: paymentMethod,
        customer_id: saleData.customer_id ? String(saleData.customer_id) : null,
        customer_name: saleData.customer_name ? String(saleData.customer_name) : null,
        customer_phone: saleData.customer_phone ? String(saleData.customer_phone) : null,
        customer_tin: saleData.customer_tin ? String(saleData.customer_tin) : null,
        customer_vat_registration_no: saleData.customer_vat_registration_no
          ? String(saleData.customer_vat_registration_no)
          : null,
        maintenance_ticket_id: saleData.maintenance_ticket_id ? String(saleData.maintenance_ticket_id) : null,
        supplier_name: saleData.supplier_name ? String(saleData.supplier_name) : null,
        supplier_tin: saleData.supplier_tin ? String(saleData.supplier_tin) : null,
        vat_registration_date: saleData.vat_registration_date
          ? new Date(String(saleData.vat_registration_date))
          : null,
        supplier_vat_registration_no: saleData.supplier_vat_registration_no
          ? String(saleData.supplier_vat_registration_no)
          : null,
        supplier_address_sub_city: saleData.supplier_address_sub_city
          ? String(saleData.supplier_address_sub_city)
          : null,
        supplier_address_house_no: saleData.supplier_address_house_no
          ? String(saleData.supplier_address_house_no)
          : null,
        supplier_address_city: saleData.supplier_address_city ? String(saleData.supplier_address_city) : null,
        supplier_address_country: saleData.supplier_address_country
          ? String(saleData.supplier_address_country)
          : null,
        supplier_address_po_box: saleData.supplier_address_po_box ? String(saleData.supplier_address_po_box) : null,
        subtotal_amount: subtotal,
        discount_amount: discount,
        tax_amount: tax,
        total_amount: total,
        is_repair_service: saleData.is_repair_service ? Boolean(saleData.is_repair_service) : null,
        repair_service_id: saleData.repair_service_id ? String(saleData.repair_service_id) : null,
        performed_by: performedBy || null,
        shipping_address_id: saleData.shipping_address_id ? String(saleData.shipping_address_id) : null,
        notes: saleData.notes ? String(saleData.notes) : null,
        updated_by: user.user_id,
        sync_status: 'SYNCED'
      }
    })

    const existingItemIds = new Set(existing.items.map((item) => item.sale_item_id))
    const incomingIds = normalizedItems.map((item) => item.sale_item_id)
    if (incomingIds.length > 0) {
      await tx.saleItem.deleteMany({
        where: { sale_id: saleId, sale_item_id: { notIn: incomingIds } }
      })
    } else {
      await tx.saleItem.deleteMany({ where: { sale_id: saleId } })
    }

    for (const item of normalizedItems) {
      if (existingItemIds.has(item.sale_item_id)) {
        await tx.saleItem.update({
          where: { sale_item_id: item.sale_item_id },
          data: {
            item_id: item.item_id ?? null,
            description: item.description ?? null,
            line_type: item.line_type,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_amount: item.discount_amount,
            tax_amount: item.tax_amount,
            line_total: item.line_total,
            affects_inventory: item.affects_inventory,
            updated_by: user.user_id,
            sync_status: 'SYNCED'
          }
        })
      } else {
        await tx.saleItem.create({
          data: {
            ...item,
            created_by: user.user_id,
            sync_status: 'SYNCED'
          }
        })
      }
    }

    if (attachments.length > 0) {
      await tx.saleAttachment.createMany({
        data: attachments.map((entry) => ({
          attachment_id: createId(),
          sale_id: saleId,
          file_name: entry.file_name,
          file_type: entry.file_type,
          file_size: entry.file_size,
          data_url: entry.data_url,
          created_by: user.user_id,
          sync_status: 'SYNCED'
        }))
      })
    }

    const updatedItems = await tx.saleItem.findMany({ where: { sale_id: saleId } })
    const updatedAttachments = await tx.saleAttachment.findMany({ where: { sale_id: saleId } })

    return { sale: updatedSale, items: updatedItems, attachments: updatedAttachments }
  })

  return {
    sale: mapSale(result.sale),
    items: result.items.map(mapSaleItem),
    attachments: result.attachments.map(mapSaleAttachment)
  }
})
