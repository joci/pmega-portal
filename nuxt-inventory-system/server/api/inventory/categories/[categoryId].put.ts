import { getPrismaClient } from '~/server/utils/prisma'
import { mapCategory } from '~/server/utils/mappers'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const user = await requireAuthUser(event)
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
      updated_by: user.user_id,
      sync_status: 'SYNCED'
    }
  })

  return mapCategory(category)
})
