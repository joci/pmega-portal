import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapSetting } from '~/server/utils/mappers'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  if (!body?.setting_key) {
    throw createError({ statusCode: 400, statusMessage: 'SETTING_KEY_REQUIRED' })
  }

  const existing = await prisma.setting.findUnique({
    where: { setting_key: body.setting_key }
  })

  const setting = existing
    ? await prisma.setting.update({
        where: { setting_id: existing.setting_id },
        data: {
          setting_value: body.setting_value ?? null,
          setting_type: body.setting_type ?? existing.setting_type,
          category: body.category ?? null,
          description: body.description ?? null,
          is_editable: body.is_editable ?? existing.is_editable,
          updated_by: user.user_id,
          sync_status: 'SYNCED'
        }
      })
    : await prisma.setting.create({
        data: {
          setting_id: body.setting_id ?? createId(),
          setting_key: body.setting_key,
          setting_value: body.setting_value ?? null,
          setting_type: body.setting_type,
          category: body.category ?? null,
          description: body.description ?? null,
          is_editable: body.is_editable ?? null,
          created_by: user.user_id,
          sync_status: 'SYNCED'
        }
      })

  return mapSetting(setting)
})
