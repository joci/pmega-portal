import { getRolePermissions } from '~/utils/permissions'

export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  const role = String(config.appRole || 'viewer').toLowerCase()
  const permissions = getRolePermissions(role)

  return { role, permissions }
})
