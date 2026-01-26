import { getPrismaClient } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const attachmentId = event.context.params?.attachmentId
  if (!attachmentId) {
    throw createError({ statusCode: 400, statusMessage: 'ATTACHMENT_ID_REQUIRED' })
  }

  await prisma.itemAttachment.delete({ where: { attachment_id: attachmentId } })

  return { ok: true }
})
