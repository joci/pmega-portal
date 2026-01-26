import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapSale, mapSaleAttachment, mapSaleItem } from '~/server/utils/mappers'

type SalePayload = {
  sale: Record<string, unknown>
  items: Array<Record<string, unknown>>
  attachments?: Array<Record<string, unknown>>
}

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const body = (await readBody(event)) as SalePayload

  if (!body?.sale || !Array.isArray(body.items)) {
    throw createError({ statusCode: 400, statusMessage: 'SALE_PAYLOAD_REQUIRED' })
  }

  const saleData = body.sale
  const items = body.items

  if (!saleData.location_id) {
    throw createError({ statusCode: 400, statusMessage: 'LOCATION_REQUIRED' })
  }

  const saleId = (saleData.sale_id as string) ?? createId()
  const saleDate = saleData.sale_date ? new Date(String(saleData.sale_date)) : new Date()
  const receiptNumber = saleData.receipt_number ? String(saleData.receipt_number).trim() : ''
  const paymentMethod = saleData.payment_method ? String(saleData.payment_method) : ''

  if (!receiptNumber) {
    throw createError({ statusCode: 400, statusMessage: 'RECEIPT_NUMBER_REQUIRED' })
  }
  if (!paymentMethod) {
    throw createError({ statusCode: 400, statusMessage: 'PAYMENT_METHOD_REQUIRED' })
  }

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

  const normalizedItems = items.map((entry) => {
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

  const priceByItem = new Map<string, { total: number; quantity: number }>()
  for (const line of normalizedItems) {
    if (!line.affects_inventory || !line.item_id) {
      continue
    }
    const current = priceByItem.get(line.item_id) ?? { total: 0, quantity: 0 }
    current.total += line.line_total
    current.quantity += line.quantity
    priceByItem.set(line.item_id, current)
  }

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.line_total, 0)
  const discount = Number(saleData.discount_amount ?? 0)
  const tax = Number(saleData.tax_amount ?? 0)
  const total = subtotal - discount + tax

  const result = await prisma.$transaction(async (tx) => {
    const shouldReserve = saleData.status === 'OPEN'
    const shouldConsume = saleData.status === 'COMPLETED'
    const shouldAffectInventory = shouldReserve || shouldConsume

    const requiredByItem = new Map<string, number>()
    for (const line of normalizedItems) {
      if (!line.affects_inventory || !line.item_id) {
        continue
      }
      requiredByItem.set(line.item_id, (requiredByItem.get(line.item_id) ?? 0) + line.quantity)
    }

    if (shouldAffectInventory && requiredByItem.size > 0) {
      const locationId = String(saleData.location_id)
      const inventoryRows = await tx.inventory.findMany({
        where: { location_id: locationId, item_id: { in: Array.from(requiredByItem.keys()) } }
      })
      const inventoryMap = new Map(
        inventoryRows.map((row) => [row.item_id, { quantity: row.quantity, reserved: row.reserved_quantity }])
      )

      for (const [itemId, quantity] of requiredByItem.entries()) {
        const row = inventoryMap.get(itemId)
        const onHand = row?.quantity ?? 0
        const reserved = row?.reserved ?? 0
        const available = onHand - reserved
        if (available < quantity) {
          throw createError({ statusCode: 409, statusMessage: 'INSUFFICIENT_STOCK' })
        }
      }
    }

    const sale = await tx.sale.create({
      data: {
        sale_id: saleId,
        sale_number: saleData.sale_number ? String(saleData.sale_number) : null,
        receipt_number: receiptNumber,
        sale_date: saleDate,
        sale_type: String(saleData.sale_type),
        status: String(saleData.status),
        payment_status: String(saleData.payment_status),
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
        performed_by: saleData.performed_by ? String(saleData.performed_by) : null,
        shipping_address_id: saleData.shipping_address_id ? String(saleData.shipping_address_id) : null,
        notes: saleData.notes ? String(saleData.notes) : null,
        location_id: String(saleData.location_id),
        sync_status: 'SYNCED'
      }
    })

    if (normalizedItems.length > 0) {
      await tx.saleItem.createMany({
        data: normalizedItems.map((entry) => ({
          ...entry,
          sync_status: 'SYNCED'
        }))
      })
    }

    if (shouldReserve && requiredByItem.size > 0) {
      for (const [itemId, quantity] of requiredByItem.entries()) {
        await tx.inventory.upsert({
          where: {
            item_id_location_id: { item_id: itemId, location_id: String(saleData.location_id) }
          },
          update: {
            reserved_quantity: { increment: quantity },
            sync_status: 'SYNCED'
          },
          create: {
            inventory_id: createId(),
            item_id: itemId,
            location_id: String(saleData.location_id),
            quantity: 0,
            reserved_quantity: quantity,
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
          sync_status: 'SYNCED'
        }))
      })
    }

    if (shouldConsume && requiredByItem.size > 0) {
      for (const [itemId, quantity] of requiredByItem.entries()) {
        const batches = await tx.inventoryBatch.findMany({
          where: { item_id: itemId, location_id: String(saleData.location_id), quantity_remaining: { gt: 0 } },
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
          where: {
            item_id_location_id: { item_id: itemId, location_id: String(saleData.location_id) }
          },
          update: {
            quantity: { decrement: quantity },
            sync_status: 'SYNCED'
          },
          create: {
            inventory_id: createId(),
            item_id: itemId,
            location_id: String(saleData.location_id),
            quantity: 0,
            reserved_quantity: 0,
            sync_status: 'SYNCED'
          }
        })

        const priceEntry = priceByItem.get(itemId)
        const unitPrice =
          priceEntry && priceEntry.quantity > 0 ? priceEntry.total / priceEntry.quantity : null
        const unitCost = costQuantity > 0 ? costTotal / costQuantity : null

        await tx.inventoryMovement.create({
          data: {
            movement_id: createId(),
            item_id: itemId,
            location_id: String(saleData.location_id),
            quantity,
            movement_type: 'SALE',
            reference_id: saleId,
            unit_cost: unitCost,
            unit_price: unitPrice,
            created_at: saleDate,
            sync_status: 'SYNCED'
          }
        })
      }
    }

    const createdItems = await tx.saleItem.findMany({ where: { sale_id: saleId } })
    const createdAttachments = await tx.saleAttachment.findMany({ where: { sale_id: saleId } })

    return { sale, items: createdItems, attachments: createdAttachments }
  })

  return {
    sale: mapSale(result.sale),
    items: result.items.map(mapSaleItem),
    attachments: result.attachments.map(mapSaleAttachment)
  }
})
