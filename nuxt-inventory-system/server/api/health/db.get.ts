import { getDbProfile } from '~/server/utils/dbConfig'
import { getPrismaClient } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const prisma = getPrismaClient()

  await prisma.$queryRaw`SELECT 1`

  const { name } = getDbProfile()

  return {
    ok: true,
    profile: name
  }
})
