<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">{{ t('settings.title') }}</h1>
      <p class="text-sm text-slate-600">{{ t('settings.subtitle') }}</p>
    </div>

    <div v-if="!canViewSettings" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('permissions.noAccess') }}
    </div>

    <div v-else class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('settings.general.title') }}</h2>
        <UButton
          size="sm"
          color="primary"
          :loading="isSaving"
          :disabled="isSaving || !canEditSettings"
          @click="saveSettings"
        >
          {{ t('settings.actions.save') }}
        </UButton>
      </div>

      <div v-if="!canEditSettings" class="mt-3 text-xs text-slate-500">
        {{ t('permissions.readOnly') }}
      </div>

      <div v-if="message" class="mt-4">
        <UAlert :color="message.type" :title="message.text" />
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <div v-if="canViewTaxRate">
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('settings.fields.taxRate') }}</label>
          <input
            v-model="form.tax_rate"
            type="number"
            step="0.01"
            min="0"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            :disabled="!canEditTaxRate"
          />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('settings.fields.defaultMargin') }}
          </label>
          <input
            v-model="form.default_margin_percent"
            type="number"
            step="0.01"
            min="0"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            :disabled="!canEditSettings"
          />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('settings.fields.salesDiscounts') }}
          </label>
          <select
            v-model="form.sales_discounts_enabled"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            :disabled="!canEditSettings"
          >
            <option value="false">{{ t('settings.options.disabled') }}</option>
            <option value="true">{{ t('settings.options.enabled') }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('settings.fields.location') }}</label>
          <select
            v-model="form.app_location_id"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            :disabled="!canEditSettings"
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
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('settings.fields.businessName') }}</label>
          <input
            v-model="form.business_name"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            :disabled="!canEditSettings"
          />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('settings.fields.supplierTin') }}</label>
          <input
            v-model="form.supplier_tin"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            :disabled="!canEditSettings"
          />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('settings.fields.vatRegistrationDate') }}
          </label>
          <input
            v-model="form.vat_registration_date"
            type="date"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            :disabled="!canEditSettings"
          />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('settings.fields.vatRegistrationNo') }}
          </label>
          <input
            v-model="form.vat_registration_no"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            :disabled="!canEditSettings"
          />
        </div>
      </div>
    </div>

    <div
      v-if="canResetData"
      class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm"
    >
      <div class="text-base font-semibold text-rose-900">{{ t('settings.reset.title') }}</div>
      <p class="mt-2 text-sm text-rose-700">
        {{ t('settings.reset.description') }}
      </p>
      <div v-if="resetMessage" class="mt-4">
        <UAlert :color="resetMessage.type" :title="resetMessage.text" />
      </div>
      <div class="mt-4 grid gap-3 md:grid-cols-[1.5fr,auto] md:items-end">
        <div>
          <label class="text-xs font-semibold uppercase text-rose-700">{{ t('settings.reset.confirmLabel') }}</label>
          <input
            v-model="resetConfirm"
            class="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm"
            :placeholder="t('settings.reset.confirmPlaceholder')"
          />
          <p class="mt-1 text-xs text-rose-600">{{ t('settings.reset.confirmHelper') }}</p>
        </div>
        <UButton color="red" :disabled="isResetting" @click="resetAllData">
          {{ t('settings.reset.action') }}
        </UButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { useSettingsStore } from '~/stores/settings'
import { useMaintenanceStore } from '~/stores/maintenance'
import { useSalesStore } from '~/stores/sales'
import { usePermissions } from '~/composables/usePermissions'
import { useAuth } from '~/composables/useAuth'
import { resetDatabase } from '~/composables/useDatabase'

const settingsStore = useSettingsStore()
const inventoryStore = useInventoryStore()
const maintenanceStore = useMaintenanceStore()
const salesStore = useSalesStore()
const { can, loadPermissions } = usePermissions()
const { user } = useAuth()
const { t } = useI18n()

const canViewSettings = computed(() => can('settings.view'))
const canEditSettings = computed(() => can('settings.edit'))
const canViewTaxRate = computed(() => can('settings.field.tax_rate.view'))
const canEditTaxRate = computed(() => can('settings.field.tax_rate.edit'))
const canResetData = computed(() => user.value?.role === 'admin')

const resetConfirm = ref('')
const resetMessage = ref<{ type: 'primary' | 'red'; text: string } | null>(null)
const isResetting = ref(false)
const { isSubmitting: isSaving, runWithLock: withSaveLock } = useSubmitLock()

const form = reactive({
  tax_rate: '0.15',
  app_location_id: '',
  default_margin_percent: '40',
  sales_discounts_enabled: 'false',
  business_name: 'Omega Electronics PLC',
  supplier_tin: '',
  vat_registration_date: '',
  vat_registration_no: '010901'
})

const message = ref<{ type: 'primary' | 'red'; text: string } | null>(null)

const loadSettings = () => {
  const taxSetting = settingsStore.getSetting('tax_rate')
  const locationSetting = settingsStore.getSetting('app_location_id')
  const marginSetting = settingsStore.getSetting('default_margin_percent')
  const discountSetting = settingsStore.getSetting('sales_discounts_enabled')
  const businessSetting = settingsStore.getSetting('business_name')
  const tinSetting = settingsStore.getSetting('supplier_tin')
  const vatSetting = settingsStore.getSetting('vat_registration_date')
  const vatNumberSetting = settingsStore.getSetting('vat_registration_no')
  if (taxSetting?.setting_value) {
    form.tax_rate = taxSetting.setting_value
  }
  if (locationSetting?.setting_value) {
    form.app_location_id = locationSetting.setting_value
  }
  if (marginSetting?.setting_value) {
    form.default_margin_percent = marginSetting.setting_value
  }
  if (discountSetting?.setting_value) {
    form.sales_discounts_enabled = discountSetting.setting_value
  }
  if (businessSetting?.setting_value) {
    form.business_name = businessSetting.setting_value
  }
  if (tinSetting?.setting_value) {
    form.supplier_tin = tinSetting.setting_value
  }
  if (vatSetting?.setting_value) {
    form.vat_registration_date = vatSetting.setting_value
  }
  if (vatNumberSetting?.setting_value) {
    form.vat_registration_no = vatNumberSetting.setting_value
  }
}

const saveSettings = async () => {
  await withSaveLock(async () => {
    message.value = null
    if (!canEditSettings.value) {
      message.value = { type: 'red', text: t('permissions.readOnly') }
      return
    }
    await settingsStore.upsertSetting({
      setting_key: 'tax_rate',
      setting_value: form.tax_rate,
      setting_type: 'NUMBER',
      description: 'Default tax rate'
    })

    await settingsStore.upsertSetting({
      setting_key: 'default_margin_percent',
      setting_value: form.default_margin_percent,
      setting_type: 'NUMBER',
      description: 'Default margin percentage for pricing'
    })

    await settingsStore.upsertSetting({
      setting_key: 'sales_discounts_enabled',
      setting_value: form.sales_discounts_enabled,
      setting_type: 'BOOLEAN',
      description: 'Enable discounts on sales'
    })

    if (form.app_location_id) {
      await settingsStore.upsertSetting({
        setting_key: 'app_location_id',
        setting_value: form.app_location_id,
        setting_type: 'STRING',
        description: 'Current application location id'
      })
    }

    await settingsStore.upsertSetting({
      setting_key: 'business_name',
      setting_value: form.business_name,
      setting_type: 'STRING',
      description: 'Registered business name'
    })

    await settingsStore.upsertSetting({
      setting_key: 'supplier_tin',
      setting_value: form.supplier_tin,
      setting_type: 'STRING',
      description: 'Supplier TIN number'
    })

    await settingsStore.upsertSetting({
      setting_key: 'vat_registration_date',
      setting_value: form.vat_registration_date,
      setting_type: 'DATE',
      description: 'VAT registration date'
    })

    await settingsStore.upsertSetting({
      setting_key: 'vat_registration_no',
      setting_value: form.vat_registration_no,
      setting_type: 'STRING',
      description: 'Supplier VAT registration number'
    })

    message.value = { type: 'primary', text: t('settings.messages.saved') }
  })
}

const resetAllData = async () => {
  resetMessage.value = null
  if (!canResetData.value) {
    resetMessage.value = { type: 'red', text: t('settings.reset.forbidden') }
    return
  }
  if (resetConfirm.value.trim() !== 'RESET_ALL_DATA') {
    resetMessage.value = { type: 'red', text: t('settings.reset.invalidConfirm') }
    return
  }
  isResetting.value = true
  try {
    await $fetch('/api/admin/reset', {
      method: 'POST',
      body: { confirm: resetConfirm.value.trim() }
    })
    inventoryStore.reset()
    maintenanceStore.reset()
    salesStore.reset()
    settingsStore.reset()
    await resetDatabase()
    await inventoryStore.loadAll()
    await maintenanceStore.loadAll()
    await salesStore.loadAll()
    await settingsStore.loadAll()
    resetConfirm.value = ''
    resetMessage.value = { type: 'primary', text: t('settings.reset.success') }
  } catch (error) {
    resetMessage.value = { type: 'red', text: t('settings.reset.failed') }
    console.warn('Failed to reset data', error)
  } finally {
    isResetting.value = false
  }
}

onMounted(async () => {
  await loadPermissions()
  if (!inventoryStore.isLoaded) {
    await inventoryStore.loadAll()
  }
  if (!settingsStore.isLoaded) {
    await settingsStore.loadAll()
  }
  loadSettings()
})
</script>
