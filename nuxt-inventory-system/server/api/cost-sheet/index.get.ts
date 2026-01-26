import { getPrismaClient } from '~/server/utils/prisma'
import { mapCostSheetEntry } from '~/server/utils/mappers'

export default defineEventHandler(async () => {
  const prisma = getPrismaClient()
  const entries = await prisma.costSheetEntry.findMany({
    orderBy: { created_at: 'desc' },
    include: { item: true }
  })

  return entries.map(mapCostSheetEntry)
})
