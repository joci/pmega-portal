import { getPrismaClient } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const categoryId = event.context.params?.categoryId
  if (!categoryId) {
    throw createError({ statusCode: 400, statusMessage: 'CATEGORY_ID_REQUIRED' })
  }

  const itemCount = await prisma.item.count({ where: { category_id: categoryId } })
  if (itemCount > 0) {
    throw createError({ statusCode: 409, statusMessage: 'CATEGORY_IN_USE' })
  }

  await prisma.category.delete({ where: { category_id: categoryId } })

  return { ok: true }
})
