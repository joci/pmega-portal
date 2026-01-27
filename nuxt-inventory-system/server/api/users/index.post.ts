import { getPrismaClient } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { hashPassword } from '~/server/utils/password'
import { createId } from '~/utils/id'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const prisma = getPrismaClient()
  const body = await readBody(event)

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const role = typeof body?.role === 'string' ? body.role.trim() : 'staff'

  if (!email || !username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'FIELDS_REQUIRED' })
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }]
    }
  })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'USER_EXISTS' })
  }

  const user = await prisma.user.create({
    data: {
      user_id: createId(),
      email,
      username,
      name: name || null,
      role,
      password_hash: hashPassword(password),
      is_active: true,
      created_by: admin.user_id
    }
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
