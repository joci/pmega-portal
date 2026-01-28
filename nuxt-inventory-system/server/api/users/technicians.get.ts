import { getPrismaClient } from '~/server/utils/prisma'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuthUser(event)
  const prisma = getPrismaClient()

  const users = await prisma.user.findMany({
    where: {
      role: 'technician',
      is_active: true
    },
    orderBy: [{ name: 'asc' }, { username: 'asc' }]
  })

  return {
    technicians: users.map((user) => ({
      user_id: user.user_id,
      name: user.name ?? null,
      username: user.username,
      email: user.email
    }))
  }
})
