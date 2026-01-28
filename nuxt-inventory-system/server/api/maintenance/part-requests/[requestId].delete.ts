import { getPrismaClient } from '~/server/utils/prisma'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const user = await requireAuthUser(event)
  const requestId = event.context.params?.requestId

  if (!requestId) {
    throw createError({ statusCode: 400, statusMessage: 'REQUEST_ID_REQUIRED' })
  }

  if (user.role !== 'admin' && user.role !== 'manager') {
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  }

  const request = await prisma.partRequest.findUnique({ where: { request_id: requestId } })
  if (!request) {
    throw createError({ statusCode: 404, statusMessage: 'REQUEST_NOT_FOUND' })
  }

  if (request.source_preference === 'STORE_INVENTORY' && request.status === 'APPROVED') {
    throw createError({ statusCode: 409, statusMessage: 'REQUEST_APPROVED_LOCKED' })
  }

  await prisma.partRequest.delete({ where: { request_id: requestId } })

  return { ok: true }
})
