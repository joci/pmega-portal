import { getPrismaClient } from '~/server/utils/prisma'
import { createSession } from '~/server/utils/auth'
import { verifyPassword } from '~/server/utils/password'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const body = await readBody(event)
  const identifier = typeof body?.identifier === 'string' ? body.identifier.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!identifier || !password) {
    throw createError({ statusCode: 400, statusMessage: 'CREDENTIALS_REQUIRED' })
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: identifier, mode: 'insensitive' } },
        { username: { equals: identifier, mode: 'insensitive' } }
      ]
    }
  })

  if (!user || !user.is_active) {
    throw createError({ statusCode: 401, statusMessage: 'INVALID_CREDENTIALS' })
  }

  const isValid = verifyPassword(password, user.password_hash)
  if (!isValid) {
    throw createError({ statusCode: 401, statusMessage: 'INVALID_CREDENTIALS' })
  }

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
