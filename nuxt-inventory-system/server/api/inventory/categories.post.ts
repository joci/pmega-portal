import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapCategory } from '~/server/utils/mappers'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  if (!body?.name) {
    throw createError({ statusCode: 400, statusMessage: 'NAME_REQUIRED' })
  }

  const category = await prisma.category.create({
    data: {
      category_id: createId(),
      name: body.name,
      description: body.description ?? null,
      category_type: body.category_type,
      created_by: user.user_id,
      sync_status: 'SYNCED'
    }
  })

  return mapCategory(category)
})
