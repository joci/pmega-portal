import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapCategory } from '~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
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
      sync_status: 'SYNCED'
    }
  })

  return mapCategory(category)
})
