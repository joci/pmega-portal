import { getPrismaClient } from '~/server/utils/prisma'
import { mapCategory } from '~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const categoryId = event.context.params?.categoryId
  if (!categoryId) {
    throw createError({ statusCode: 400, statusMessage: 'CATEGORY_ID_REQUIRED' })
  }

  const body = await readBody(event)
  const category = await prisma.category.update({
    where: { category_id: categoryId },
    data: {
      name: body.name,
      description: body.description ?? null,
      category_type: body.category_type,
      sync_status: 'SYNCED'
    }
  })

  return mapCategory(category)
})
