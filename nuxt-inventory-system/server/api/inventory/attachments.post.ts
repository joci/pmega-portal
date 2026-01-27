import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapAttachment } from '~/server/utils/mappers'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  if (!body?.item_id) {
    throw createError({ statusCode: 400, statusMessage: 'ITEM_ID_REQUIRED' })
  }
  if (!body?.file_name || !body?.data_url) {
    throw createError({ statusCode: 400, statusMessage: 'ATTACHMENT_REQUIRED' })
  }

  const attachment = await prisma.itemAttachment.create({
    data: {
      attachment_id: createId(),
      item_id: body.item_id,
      file_name: body.file_name,
      file_type: body.file_type,
      file_size: body.file_size ?? 0,
      data_url: body.data_url,
      sort_order: body.sort_order ?? null,
      created_by: user.user_id,
      sync_status: 'SYNCED'
    }
  })

  return mapAttachment(attachment)
})
