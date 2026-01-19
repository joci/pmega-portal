<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">{{ t('settings.title') }}</h1>
      <p class="text-sm text-slate-600">{{ t('settings.subtitle') }}</p>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('settings.general.title') }}</h2>
        <UButton size="sm" color="primary" @click="saveSettings">{{ t('settings.actions.save') }}</UButton>
      </div>

      <div v-if="message" class="mt-4">
        <UAlert :color="message.type" :title="message.text" />
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('settings.fields.taxRate') }}</label>
          <input
            v-model="form.tax_rate"
            type="number"
            step="0.01"
            min="0"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('settings.fields.location') }}</label>
          <select
            v-model="form.app_location_id"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">{{ t('settings.options.selectLocation') }}</option>
            <option
              v-for="location in inventoryStore.locations"
              :key="location.location_id"
              :value="location.location_id"
            >
              {{ location.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
      {{ t('settings.placeholder') }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { useSettingsStore } from '~/stores/settings'

const settingsStore = useSettingsStore()
const inventoryStore = useInventoryStore()
const { t } = useI18n()

const form = reactive({
  tax_rate: '0.15',
  app_location_id: ''
})

const message = ref<{ type: 'primary' | 'red'; text: string } | null>(null)

const loadSettings = () => {
  const taxSetting = settingsStore.getSetting('tax_rate')
  const locationSetting = settingsStore.getSetting('app_location_id')
  if (taxSetting?.setting_value) {
    form.tax_rate = taxSetting.setting_value
  }
  if (locationSetting?.setting_value) {
    form.app_location_id = locationSetting.setting_value
  }
}

const saveSettings = async () => {
  message.value = null
  await settingsStore.upsertSetting({
    setting_key: 'tax_rate',
    setting_value: form.tax_rate,
    setting_type: 'NUMBER',
    description: 'Default tax rate'
  })

  if (form.app_location_id) {
    await settingsStore.upsertSetting({
      setting_key: 'app_location_id',
      setting_value: form.app_location_id,
      setting_type: 'STRING',
      description: 'Current application location id'
    })
  }

  message.value = { type: 'primary', text: t('settings.messages.saved') }
}

onMounted(async () => {
  if (!inventoryStore.isLoaded) {
    await inventoryStore.loadAll()
  }
  if (!settingsStore.isLoaded) {
    await settingsStore.loadAll()
  }
  loadSettings()
})
</script>
