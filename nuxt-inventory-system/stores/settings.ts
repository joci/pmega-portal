import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDatabase } from '~/composables/useDatabase'
import { createId } from '~/utils/id'
import type { Setting } from '~/types/database'

const nowIso = () => new Date().toISOString()

const defaultSettings: Setting[] = [
  {
    setting_id: 'setting-sync-001',
    setting_key: 'sync_interval_minutes',
    setting_value: '5',
    setting_type: 'NUMBER',
    description: 'Sync interval in minutes'
  },
  {
    setting_id: 'setting-sync-002',
    setting_key: 'auto_sync_enabled',
    setting_value: 'true',
    setting_type: 'BOOLEAN',
    description: 'Enable automatic background sync'
  },
  {
    setting_id: 'setting-inv-001',
    setting_key: 'low_stock_threshold',
    setting_value: '5',
    setting_type: 'NUMBER',
    description: 'Low stock alert threshold'
  },
  {
    setting_id: 'setting-app-001',
    setting_key: 'app_location_id',
    setting_value: 'store-location-001',
    setting_type: 'STRING',
    description: 'Current application location id'
  },
  {
    setting_id: 'setting-app-002',
    setting_key: 'tax_rate',
    setting_value: '0.15',
    setting_type: 'NUMBER',
    description: 'Default tax rate (15%)'
  }
]

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Setting[]>([])
  const isLoaded = ref(false)

  const getDb = () => {
    const db = useDatabase()
    if (!db) {
      throw new Error('Database is only available on the client')
    }

    return db
  }

  const seedDefaults = async () => {
    const db = getDb()
    const count = await db.settings.count()
    if (count === 0) {
      await db.settings.bulkAdd(defaultSettings)
    }
  }

  const loadAll = async () => {
    const db = getDb()
    await seedDefaults()
    settings.value = await db.settings.toArray()
    isLoaded.value = true
  }

  const upsertSetting = async (payload: Omit<Setting, 'setting_id'> & { setting_id?: string }) => {
    const db = getDb()
    const existing = await db.settings.where('setting_key').equals(payload.setting_key).first()

    if (existing) {
      const updated: Setting = {
        ...existing,
        ...payload,
        updated_at: nowIso()
      }
      await db.settings.put(updated)
      settings.value = settings.value.map((entry) =>
        entry.setting_id === updated.setting_id ? updated : entry
      )
      return
    }

    const created: Setting = {
      ...payload,
      setting_id: payload.setting_id ?? createId(),
      created_at: nowIso(),
      updated_at: nowIso(),
      sync_status: 'SYNCED'
    }
    await db.settings.add(created)
    settings.value = [created, ...settings.value]
  }

  const getSetting = (key: string) => {
    return settings.value.find((entry) => entry.setting_key === key)
  }

  return {
    settings,
    isLoaded,
    loadAll,
    upsertSetting,
    getSetting
  }
})
