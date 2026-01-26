import { getPrismaClient } from '~/server/utils/prisma'
import { mapItem } from '~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const body = await readBody(event)
  const fromCategoryId = body?.fromCategoryId
  const toCategoryId = body?.toCategoryId ?? null

  if (!fromCategoryId) {
    throw createError({ statusCode: 400, statusMessage: 'FROM_CATEGORY_REQUIRED' })
  }

  const affected = await prisma.item.findMany({ where: { category_id: fromCategoryId } })
  if (affected.length === 0) {
    return { updated: [] }
  }

  await prisma.item.updateMany({
    where: { category_id: fromCategoryId },
    data: {
      category_id: toCategoryId,
      sync_status: 'SYNCED'
    }
  })

  const updatedItems = await prisma.item.findMany({
    where: { item_id: { in: affected.map((item) => item.item_id) } }
  })

  return { updated: updatedItems.map(mapItem) }
})
