import { getRequestURL } from 'h3'
import { getAuthUser } from '~/server/utils/auth'

const openPaths = new Set([
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/auth/bootstrap'
])

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api')) {
    return
  }
  if (openPaths.has(path)) {
    return
  }
  const user = await getAuthUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })
  }
})
