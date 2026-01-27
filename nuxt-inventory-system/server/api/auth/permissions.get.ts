import { getRolePermissions } from '~/utils/permissions'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const role = String(user.role || 'viewer').toLowerCase()
  const permissions = getRolePermissions(role)

  return { role, permissions }
})
