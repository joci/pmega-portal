import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapCustomer } from '~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const body = await readBody(event)

  if (!body?.name) {
    throw createError({ statusCode: 400, statusMessage: 'NAME_REQUIRED' })
  }

  const customer = await prisma.customer.create({
    data: {
      customer_id: body.customer_id ?? createId(),
      name: body.name,
      name_amharic: body.name_amharic ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      tin: body.tin ?? null,
      vat_registration_no: body.vat_registration_no ?? null,
      address_id: body.address_id ?? null,
      customer_type: body.customer_type ?? null,
      sync_status: 'SYNCED'
    }
  })

  return mapCustomer(customer)
})
