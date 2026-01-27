import { getPrismaClient } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { hashPassword } from '~/server/utils/password'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const prisma = getPrismaClient()
  const userId = event.context.params?.userId
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'USER_ID_REQUIRED' })
  }

  const body = await readBody(event)
  const updates: Record<string, unknown> = {
    updated_by: admin.user_id
  }

  if (typeof body?.email === 'string' && body.email.trim()) {
    updates.email = body.email.trim().toLowerCase()
  }
  if (typeof body?.username === 'string' && body.username.trim()) {
    updates.username = body.username.trim().toLowerCase()
  }
  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    updates.name = name || null
  }
  if (typeof body?.role === 'string' && body.role.trim()) {
    updates.role = body.role.trim()
  }
  if (Object.prototype.hasOwnProperty.call(body, 'is_active')) {
    updates.is_active = Boolean(body.is_active)
  }
  if (typeof body?.password === 'string' && body.password) {
    updates.password_hash = hashPassword(body.password)
  }

  const user = await prisma.user.update({
    where: { user_id: userId },
    data: updates
  })

  return {
    user: {
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
    }
  }
})
