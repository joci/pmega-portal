import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)
  return { user }
})
