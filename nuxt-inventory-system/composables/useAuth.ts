import { computed } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { useMaintenanceStore } from '~/stores/maintenance'
import { useSalesStore } from '~/stores/sales'
import { useSettingsStore } from '~/stores/settings'
import { resetDatabase } from '~/composables/useDatabase'
import { usePermissions } from '~/composables/usePermissions'
import { useFlashMessage } from '~/composables/useFlashMessage'

export type AuthUser = {
  user_id: string
  email: string
  username: string
  name?: string | null
  role: string
}

export const useAuth = () => {
  const user = useState<AuthUser | null>('authUser', () => null)
  const isLoaded = useState<boolean>('authLoaded', () => false)

  const loadSession = async () => {
    if (isLoaded.value) {
      return
    }
    const headers = process.server ? useRequestHeaders(['cookie']) : undefined
    const payload = await $fetch<{ user: AuthUser | null }>('/api/auth/session', { headers })
    user.value = payload.user
    isLoaded.value = true
  }

  const login = async (identifier: string, password: string) => {
    const payload = await $fetch<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: { identifier, password }
    })
    user.value = payload.user
    isLoaded.value = true
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    isLoaded.value = false
    const inventoryStore = useInventoryStore()
    const maintenanceStore = useMaintenanceStore()
    const salesStore = useSalesStore()
    const settingsStore = useSettingsStore()
    inventoryStore.reset()
    maintenanceStore.reset()
    salesStore.reset()
    settingsStore.reset()
    const { resetPermissions } = usePermissions()
    resetPermissions()
    const { clearFlashMessage } = useFlashMessage()
    clearFlashMessage()
    await resetDatabase()
  }

  const isAuthenticated = computed(() => Boolean(user.value))

  return {
    user,
    isLoaded,
    isAuthenticated,
    loadSession,
    login,
    logout
  }
}
