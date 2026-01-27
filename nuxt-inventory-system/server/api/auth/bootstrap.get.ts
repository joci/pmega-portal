import { getPrismaClient } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const prisma = getPrismaClient()
  const count = await prisma.user.count()
  return { needs_setup: count === 0 }
})
