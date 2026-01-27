import { getPrismaClient } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const prisma = getPrismaClient()

  const users = await prisma.user.findMany({ orderBy: { created_at: 'desc' } })

  return {
    users: users.map((user) => ({
      user_id: user.user_id,
      email: user.email,
      username: user.username,
      name: user.name ?? null,
      role: String(user.role),
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      created_by: user.created_by ?? null,
      updated_by: user.updated_by ?? null
    }))
  }
})
