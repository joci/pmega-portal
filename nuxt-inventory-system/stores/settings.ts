import { defineStore } from 'pinia'
import { $fetch } from 'ofetch'
import { ref } from 'vue'
import { useDatabase } from '~/composables/useDatabase'
import type { Setting } from '~/types/database'

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
  },
  {
    setting_id: 'setting-app-003',
    setting_key: 'business_name',
    setting_value: 'Omega Electronics PLC',
    setting_type: 'STRING',
    description: 'Registered business name'
  },
  {
    setting_id: 'setting-app-004',
    setting_key: 'supplier_tin',
    setting_value: '',
    setting_type: 'STRING',
    description: 'Supplier TIN number'
  },
  {
    setting_id: 'setting-app-005',
    setting_key: 'vat_registration_date',
    setting_value: '',
    setting_type: 'DATE',
    description: 'VAT registration date'
  },
  {
    setting_id: 'setting-app-006',
    setting_key: 'vat_registration_no',
    setting_value: '010901',
    setting_type: 'STRING',
    description: 'Supplier VAT registration number'
  },
  {
    setting_id: 'setting-pricing-001',
    setting_key: 'default_margin_percent',
    setting_value: '40',
    setting_type: 'NUMBER',
    description: 'Default margin percentage for pricing'
  },
  {
    setting_id: 'setting-sales-001',
    setting_key: 'sales_discounts_enabled',
    setting_value: 'false',
    setting_type: 'BOOLEAN',
    description: 'Enable discounts on sales'
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
    try {
      const payload = await $fetch<{ settings: Setting[] }>('/api/settings')
      settings.value = payload.settings
      isLoaded.value = true
      await db.transaction('rw', db.settings, async () => {
        await db.settings.clear()
        await db.settings.bulkAdd(payload.settings)
      })
      return
    } catch (error) {
      console.warn('Failed to load settings from server, falling back to cache.', error)
    }

    await seedDefaults()
    settings.value = await db.settings.toArray()
    isLoaded.value = true
  }

  const upsertSetting = async (payload: Omit<Setting, 'setting_id'> & { setting_id?: string }) => {
    const db = getDb()
    const setting = await $fetch<Setting>('/api/settings', {
      method: 'PUT',
      body: payload
    })

    const exists = settings.value.find((entry) => entry.setting_id === setting.setting_id)
    if (exists) {
      settings.value = settings.value.map((entry) =>
        entry.setting_id === setting.setting_id ? setting : entry
      )
    } else {
      settings.value = [setting, ...settings.value]
    }
    await db.settings.put(setting)
  }

  const getSetting = (key: string) => {
    return settings.value.find((entry) => entry.setting_key === key)
  }

  const reset = () => {
    settings.value = []
    isLoaded.value = false
  }

  return {
    settings,
    isLoaded,
    loadAll,
    upsertSetting,
    getSetting,
    reset
  }
})
