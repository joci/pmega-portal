import { getPrismaClient } from '~/server/utils/prisma'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const user = await requireAuthUser(event)
  const body = await readBody(event)
  const itemId = body?.item_id
  const orderedIds = Array.isArray(body?.ordered_ids) ? body.ordered_ids : []

  if (!itemId || orderedIds.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'REORDER_PAYLOAD_REQUIRED' })
  }

  await prisma.$transaction(
    orderedIds.map((attachmentId: string, index: number) =>
      prisma.itemAttachment.update({
        where: { attachment_id: attachmentId },
        data: {
          item_id: itemId,
          sort_order: index,
          updated_by: user.user_id,
          sync_status: 'SYNCED'
        }
      })
    )
  )

  return { ok: true }
})
