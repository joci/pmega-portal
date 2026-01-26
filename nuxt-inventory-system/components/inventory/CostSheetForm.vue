<template>
  <div>
    <div v-if="!canViewInventory" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('permissions.noAccess') }}
    </div>

    <div v-else class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold text-slate-900">
        {{ isEditing ? t('inventory.costSheetPage.editTitle') : t('inventory.costSheetPage.newTitle') }}
      </h2>
      <form class="mt-4 grid gap-4" @submit.prevent="handleSubmit">
        <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {{ formError }}
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('inventory.costSheetPage.fields.date') }}
          </label>
          <input
            v-model="form.entry_date"
            type="date"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            :disabled="!canEditInventory"
            required
          />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('inventory.costSheetPage.fields.itemName') }}
          </label>
          <input
            v-model="form.item_name"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            :disabled="!canEditInventory"
            required
          />
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('inventory.costSheetPage.fields.model') }}
            </label>
            <input
              v-model="form.model"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              :disabled="!canEditInventory"
              required
            />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('inventory.costSheetPage.fields.unit') }}
            </label>
            <select
              v-model="form.unit"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              :disabled="!canEditInventory"
              required
            >
              <option value="">{{ t('inventory.options.selectUnit') }}</option>
              <option v-for="unit in store.units" :key="unit.unit_id" :value="unit.name">
                {{ unit.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('inventory.costSheetPage.fields.quantity') }}
            </label>
            <input
              v-model.number="form.quantity"
              type="number"
              min="0"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              :disabled="!canEditInventory"
              required
            />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('inventory.costSheetPage.fields.unitCost') }}
            </label>
            <input
              v-model.number="form.unit_cost"
              type="number"
              min="0"
              step="0.01"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              :disabled="!canEditInventory"
              required
            />
          </div>
        </div>
        <div class="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <div class="flex items-center justify-between">
            <span>{{ t('inventory.costSheetPage.fields.totalWithVat') }}</span>
            <span class="font-semibold text-slate-900">{{ formatCurrency(totalWithVat) }}</span>
          </div>
          <div class="mt-1 text-xs text-slate-500">
            {{ t('inventory.costSheetPage.vatRate', { rate: vatRatePercent }) }}
          </div>
        </div>
        <div class="flex flex-wrap gap-3 pt-2">
          <UButton type="submit" color="primary" :disabled="!canEditInventory">
            {{ isEditing ? t('inventory.costSheetPage.actions.update') : t('inventory.costSheetPage.actions.create') }}
          </UButton>
          <UButton
            v-if="isEditing"
            type="button"
            color="gray"
            variant="outline"
            @click="cancelEdit"
          >
            {{ t('inventory.costSheetPage.actions.cancelEdit') }}
          </UButton>
          <UButton type="button" color="gray" variant="outline" @click="resetForm">
            {{ t('inventory.costSheetPage.actions.clear') }}
          </UButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useInventoryStore, type CostSheetEntryInput } from '~/stores/inventory'
import { useSettingsStore } from '~/stores/settings'
import { usePermissions } from '~/composables/usePermissions'
import type { CostSheetEntry } from '~/types/database'

const store = useInventoryStore()
const settingsStore = useSettingsStore()
const { can, loadPermissions } = usePermissions()
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()

const canViewInventory = computed(() => can('inventory.view'))
const canEditInventory = computed(() => can('inventory.edit'))

const form = ref<CostSheetEntryInput>({
  entry_date: new Date().toISOString().slice(0, 10),
  item_name: '',
  model: '',
  unit: '',
  quantity: 1,
  unit_cost: 0
})
const formError = ref('')
const editingEntryId = ref<string | null>(null)
const isEditing = computed(() => Boolean(editingEntryId.value))
const prefillEntryId = computed(() => (typeof route.query.entry === 'string' ? route.query.entry : ''))

const vatRate = computed(() => {
  const rate = Number(settingsStore.getSetting('tax_rate')?.setting_value ?? 0)
  return Number.isFinite(rate) ? rate : 0
})
const vatRatePercent = computed(() => {
  const percent = vatRate.value * 100
  if (!Number.isFinite(percent)) {
    return '0'
  }
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(2)
})
const totalWithVat = computed(() => form.value.unit_cost * (1 + vatRate.value))

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'ETB' }).format(value || 0)
}

const resetForm = async () => {
  form.value = {
    entry_date: new Date().toISOString().slice(0, 10),
    item_name: '',
    model: '',
    unit: '',
    quantity: 1,
    unit_cost: 0
  }
  formError.value = ''
  editingEntryId.value = null
  if (prefillEntryId.value) {
    await router.replace(localePath('/inventory/cost-sheet/new'))
  }
}

const startEdit = (entry: CostSheetEntry) => {
  if (!canEditInventory.value) {
    formError.value = t('permissions.restricted')
    return
  }
  if (entry.added_to_inventory) {
    formError.value = t('inventory.costSheetPage.validation.cannotEditAdded')
    return
  }
  editingEntryId.value = entry.cost_sheet_id
  form.value = {
    entry_date: entry.entry_date ? entry.entry_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    item_name: entry.item_name,
    model: entry.model ?? '',
    unit: entry.unit ?? '',
    quantity: entry.quantity,
    unit_cost: entry.unit_cost
  }
  formError.value = ''
}

const cancelEdit = async () => {
  await resetForm()
}

const handleSubmit = async () => {
  formError.value = ''
  if (!canEditInventory.value) {
    formError.value = t('permissions.restricted')
    return
  }
  if (!form.value.item_name.trim()) {
    formError.value = t('inventory.costSheetPage.validation.itemNameRequired')
    return
  }
  if (!form.value.entry_date) {
    formError.value = t('inventory.costSheetPage.validation.dateRequired')
    return
  }
  if (!form.value.model?.trim()) {
    formError.value = t('inventory.costSheetPage.validation.modelRequired')
    return
  }
  if (!form.value.unit?.trim()) {
    formError.value = t('inventory.costSheetPage.validation.unitRequired')
    return
  }
  if (form.value.quantity <= 0) {
    formError.value = t('inventory.costSheetPage.validation.quantityRequired')
    return
  }
  if (form.value.unit_cost < 0) {
    formError.value = t('inventory.costSheetPage.validation.unitCostNonNegative')
    return
  }

  try {
    const payload = {
      entry_date: form.value.entry_date,
      item_name: form.value.item_name.trim(),
      model: form.value.model?.trim() || null,
      unit: form.value.unit?.trim() || null,
      quantity: form.value.quantity,
      unit_cost: form.value.unit_cost
    }
    if (editingEntryId.value) {
      await store.updateCostSheetEntry(editingEntryId.value, payload)
    } else {
      await store.createCostSheetEntry(payload)
    }
    await resetForm()
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status
    const statusMessage = (error as { data?: { statusMessage?: string } })?.data?.statusMessage
    if (status === 409 && statusMessage === 'COST_SHEET_ALREADY_USED') {
      formError.value = t('inventory.costSheetPage.validation.cannotEditAdded')
    } else {
      formError.value = t('inventory.costSheetPage.validation.saveFailed')
    }
    console.warn('Failed to create cost sheet entry', error)
  }
}

onMounted(async () => {
  await loadPermissions()
  if (!store.isLoaded) {
    await store.loadAll()
  }
  if (!settingsStore.isLoaded) {
    await settingsStore.loadAll()
  }
  if (prefillEntryId.value) {
    const entry = store.costSheets.find((item) => item.cost_sheet_id === prefillEntryId.value)
    if (entry) {
      startEdit(entry)
    }
  }
})
</script>
