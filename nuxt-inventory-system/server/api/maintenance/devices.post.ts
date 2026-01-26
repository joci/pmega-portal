import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapCustomerDevice } from '~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const body = await readBody(event)

  if (!body?.customer_id) {
    throw createError({ statusCode: 400, statusMessage: 'CUSTOMER_ID_REQUIRED' })
  }

  const device = await prisma.customerDevice.create({
    data: {
      device_id: body.device_id ?? createId(),
      customer_id: body.customer_id,
      catalog_item_id: body.catalog_item_id ?? null,
      item_name: body.item_name ?? null,
      brand: body.brand ?? null,
      model: body.model ?? null,
      serial_number: body.serial_number ?? null,
      purchase_date: body.purchase_date ? new Date(body.purchase_date) : null,
      warranty_expiry: body.warranty_expiry ? new Date(body.warranty_expiry) : null,
      notes: body.notes ?? null,
      sync_status: 'SYNCED'
    }
  })

  return mapCustomerDevice(device)
})
