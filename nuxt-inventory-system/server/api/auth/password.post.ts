import { getPrismaClient } from '~/server/utils/prisma'
import { hashPassword, verifyPassword } from '~/server/utils/password'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const prisma = getPrismaClient()
  const body = await readBody(event)

  const currentPassword = typeof body?.current_password === 'string' ? body.current_password : ''
  const nextPassword = typeof body?.new_password === 'string' ? body.new_password : ''

  if (!currentPassword || !nextPassword) {
    throw createError({ statusCode: 400, statusMessage: 'PASSWORD_FIELDS_REQUIRED' })
  }

  const record = await prisma.user.findUnique({ where: { user_id: user.user_id } })
  if (!record || !record.is_active) {
    throw createError({ statusCode: 403, statusMessage: 'UNAUTHORIZED' })
  }

  const isValid = verifyPassword(currentPassword, record.password_hash)
  if (!isValid) {
    throw createError({ statusCode: 400, statusMessage: 'PASSWORD_INVALID' })
  }

  if (currentPassword === nextPassword) {
    throw createError({ statusCode: 400, statusMessage: 'PASSWORD_UNCHANGED' })
  }

  await prisma.user.update({
    where: { user_id: record.user_id },
    data: {
      password_hash: hashPassword(nextPassword),
      updated_by: user.user_id
    }
  })

  return { ok: true }
})
