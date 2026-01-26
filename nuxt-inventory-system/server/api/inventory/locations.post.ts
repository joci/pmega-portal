import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapLocation } from '~/server/utils/mappers'
import { getRolePermissions } from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const role = String(config.appRole || 'viewer').toLowerCase()
  const permissions = getRolePermissions(role)
  if (!permissions.includes('inventory.locations.manage')) {
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  }

  const prisma = getPrismaClient()
  const body = await readBody(event)

  if (!body?.name) {
    throw createError({ statusCode: 400, statusMessage: 'NAME_REQUIRED' })
  }

  const location = await prisma.location.create({
    data: {
      location_id: createId(),
      name: body.name,
      location_type: body.location_type,
      sub_city: body.sub_city ?? null,
      house_no: body.house_no ?? null,
      city: body.city ?? null,
      country: body.country ?? null,
      po_box: body.po_box ?? null,
      sync_status: 'SYNCED'
    }
  })

  return mapLocation(location)
})
