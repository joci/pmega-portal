import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapUnit } from '~/server/utils/mappers'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  if (!body?.name) {
    throw createError({ statusCode: 400, statusMessage: 'NAME_REQUIRED' })
  }

  const unit = await prisma.unit.create({
    data: {
      unit_id: createId(),
      name: body.name,
      description: body.description ?? null,
      created_by: user.user_id,
      sync_status: 'SYNCED'
    }
  })

  return mapUnit(unit)
})
