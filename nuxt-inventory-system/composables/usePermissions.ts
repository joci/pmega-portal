import { $fetch } from 'ofetch'
import { useState } from '#imports'
import { permissionList } from '~/utils/permissions'
import type { PermissionKey } from '~/utils/permissions'

export const usePermissions = () => {
  const permissions = useState<PermissionKey[]>('permissions', () => [])
  const role = useState<string>('permissionRole', () => '')
  const isLoaded = useState<boolean>('permissionsLoaded', () => false)
  const signature = useState<string>('permissionsSignature', () => '')

  const nextSignature = permissionList.join('|')
  if (signature.value !== nextSignature) {
    permissions.value = []
    role.value = ''
    isLoaded.value = false
    signature.value = nextSignature
  }

  const loadPermissions = async (force = false) => {
    if (isLoaded.value && !force) {
      return
    }
    const payload = await $fetch<{ role: string; permissions: PermissionKey[] }>('/api/auth/permissions')
    permissions.value = payload.permissions
    role.value = payload.role
    isLoaded.value = true
  }

  const can = (key: PermissionKey) => permissions.value.includes(key)

  return {
    permissions,
    role,
    isLoaded,
    loadPermissions,
    can
  }
}
