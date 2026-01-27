import { clearSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await clearSession(event)
  return { ok: true }
})
