import { ensureCoreSeed } from '~/server/utils/seed'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapSetting } from '~/server/utils/mappers'

export default defineEventHandler(async () => {
  const prisma = getPrismaClient()
  await ensureCoreSeed(prisma)

  const settings = await prisma.setting.findMany({ orderBy: { setting_key: 'asc' } })

  return { settings: settings.map(mapSetting) }
})
