import { getPrismaClient } from '~/server/utils/prisma'
import { hashPassword } from '~/server/utils/password'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const prisma = getPrismaClient()
  const userId = getRouterParam(event, 'userId')
  const body = await readBody(event)

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'USER_ID_REQUIRED' })
  }

  const nextPassword = typeof body?.new_password === 'string' ? body.new_password : ''
  if (!nextPassword) {
    throw createError({ statusCode: 400, statusMessage: 'PASSWORD_REQUIRED' })
  }

  const existing = await prisma.user.findUnique({ where: { user_id: userId } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'USER_NOT_FOUND' })
  }

  await prisma.user.update({
    where: { user_id: userId },
    data: {
      password_hash: hashPassword(nextPassword),
      updated_by: admin.user_id
    }
  })

  return { ok: true }
})
