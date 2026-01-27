import { getPrismaClient } from '~/server/utils/prisma'
import { createSession } from '~/server/utils/auth'
import { hashPassword } from '~/server/utils/password'
import { createId } from '~/utils/id'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const count = await prisma.user.count()
  if (count > 0) {
    throw createError({ statusCode: 403, statusMessage: 'BOOTSTRAP_DISABLED' })
  }

  const body = await readBody(event)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'FIELDS_REQUIRED' })
  }

  const user = await prisma.user.create({
    data: {
      user_id: createId(),
      email,
      username,
      name: name || null,
      role: 'admin',
      password_hash: hashPassword(password),
      is_active: true
    }
  })

  await createSession(event, user.user_id)

  return {
    user: {
      user_id: user.user_id,
      email: user.email,
      username: user.username,
      name: user.name ?? null,
      role: String(user.role)
    }
  }
})
