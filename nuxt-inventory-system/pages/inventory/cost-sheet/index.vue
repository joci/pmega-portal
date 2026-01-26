<template>
  <section class="space-y-8">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('inventory.costSheetPage.title') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('inventory.costSheetPage.subtitle') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3 text-sm font-semibold">
        <NuxtLink
          :to="localePath('/inventory')"
          class="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          {{ t('inventory.costSheetPage.back') }}
        </NuxtLink>
        <NuxtLink v-if="canEditInventory" :to="localePath('/inventory/cost-sheet/new')">
          <UButton color="primary" size="sm">{{ t('inventory.costSheetPage.actions.new') }}</UButton>
        </NuxtLink>
      </div>
    </div>

    <div v-if="!canViewInventory" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('permissions.noAccess') }}
    </div>

    <div v-else class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('inventory.costSheetPage.listTitle') }}</h2>
        <div class="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            v-model="searchQuery"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:w-64"
            :placeholder="t('inventory.costSheetPage.list.searchPlaceholder')"
          />
        </div>
      </div>

      <div v-if="store.costSheets.length === 0" class="mt-6 text-sm text-slate-500">
        {{ t('inventory.costSheetPage.empty') }}
      </div>
      <div v-else class="mt-6 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="text-left text-xs font-semibold uppercase text-slate-500">
            <tr class="border-b border-slate-200">
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('date')">
                  {{ t('inventory.costSheetPage.fields.date') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('date') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('item')">
                  {{ t('inventory.costSheetPage.fields.itemName') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('item') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('model')">
                  {{ t('inventory.costSheetPage.fields.model') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('model') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('unit')">
                  {{ t('inventory.costSheetPage.fields.unit') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('unit') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4 text-right">
                <button type="button" class="ml-auto flex items-center gap-1" @click="toggleSort('quantity')">
                  {{ t('inventory.costSheetPage.fields.quantity') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('quantity') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4 text-right">
                <button type="button" class="ml-auto flex items-center gap-1" @click="toggleSort('unitCost')">
                  {{ t('inventory.costSheetPage.fields.unitCost') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('unitCost') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4 text-right">
                <button type="button" class="ml-auto flex items-center gap-1" @click="toggleSort('total')">
                  {{ t('inventory.costSheetPage.fields.totalWithVat') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('total') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('status')">
                  {{ t('inventory.costSheetPage.list.status') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('status') }}</span>
                </button>
              </th>
              <th class="py-2 text-right">{{ t('inventory.costSheetPage.list.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="sortedEntries.length === 0">
              <td colspan="9" class="py-6 text-center text-sm text-slate-500">
                {{ t('inventory.costSheetPage.list.noResults') }}
              </td>
            </tr>
            <tr v-for="entry in sortedEntries" :key="entry.cost_sheet_id" class="border-b border-slate-100">
              <td class="py-3 pr-4 text-sm text-slate-700">
                {{ formatDate(entry.entry_date ?? entry.created_at) }}
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">
                <div class="font-semibold text-slate-900">{{ entry.item_name }}</div>
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">{{ entry.model || '-' }}</td>
              <td class="py-3 pr-4 text-sm text-slate-700">{{ entry.unit || '-' }}</td>
              <td class="py-3 pr-4 text-right text-sm text-slate-700">{{ entry.quantity }}</td>
              <td class="py-3 pr-4 text-right text-sm text-slate-700">{{ formatCurrency(entry.unit_cost) }}</td>
              <td class="py-3 pr-4 text-right text-sm text-slate-700">{{ formatCurrency(entry.total_with_vat) }}</td>
              <td class="py-3 pr-4 text-sm">
                <span
                  class="rounded-full px-2 py-1 text-[11px] font-semibold uppercase"
                  :class="entry.added_to_inventory ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
                >
                  {{
                    entry.added_to_inventory
                      ? t('inventory.costSheetPage.badges.added')
                      : t('inventory.costSheetPage.badges.pending')
                  }}
                </span>
              </td>
              <td class="py-3 text-right">
                <div class="flex flex-wrap justify-end gap-2">
                  <NuxtLink
                    v-if="canEditInventory && !entry.added_to_inventory"
                    :to="localePath({ path: '/inventory/cost-sheet/new', query: { entry: entry.cost_sheet_id } })"
                  >
                    <UButton size="xs" color="gray" variant="outline">
                      {{ t('inventory.costSheetPage.actions.edit') }}
                    </UButton>
                  </NuxtLink>
                  <NuxtLink
                    v-if="!entry.added_to_inventory"
                    :to="localePath({ path: '/inventory/new', query: { costSheet: entry.cost_sheet_id } })"
                  >
                    <UButton size="xs" color="primary">
                      {{ t('inventory.costSheetPage.actions.addToInventory') }}
                    </UButton>
                  </NuxtLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { usePermissions } from '~/composables/usePermissions'
import type { CostSheetEntry } from '~/types/database'

type SortKey = 'date' | 'item' | 'model' | 'unit' | 'quantity' | 'unitCost' | 'total' | 'status'

const store = useInventoryStore()
const { can, loadPermissions } = usePermissions()
const { locale, t } = useI18n()
const localePath = useLocalePath()

const canViewInventory = computed(() => can('inventory.view'))
const canEditInventory = computed(() => can('inventory.edit'))

const searchQuery = ref('')
const sortKey = ref<SortKey>('date')
const sortDirection = ref<'asc' | 'desc'>('desc')

const filteredEntries = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    return store.costSheets
  }
  return store.costSheets.filter((entry) => {
    const fields = [entry.item_name, entry.model ?? '', entry.unit ?? '']
    return fields.some((field) => String(field).toLowerCase().includes(query))
  })
})

const dateValue = (entry: CostSheetEntry) => {
  const value = entry.entry_date ?? entry.created_at
  return value ? new Date(value).getTime() : 0
}

const sortedEntries = computed(() => {
  const entries = [...filteredEntries.value]
  const direction = sortDirection.value === 'asc' ? 1 : -1

  return entries.sort((a, b) => {
    let left: string | number = ''
    let right: string | number = ''

    switch (sortKey.value) {
      case 'item':
        left = a.item_name
        right = b.item_name
        break
      case 'model':
        left = a.model ?? ''
        right = b.model ?? ''
        break
      case 'unit':
        left = a.unit ?? ''
        right = b.unit ?? ''
        break
      case 'quantity':
        left = a.quantity
        right = b.quantity
        break
      case 'unitCost':
        left = a.unit_cost
        right = b.unit_cost
        break
      case 'total':
        left = a.total_with_vat
        right = b.total_with_vat
        break
      case 'status':
        left = a.added_to_inventory ? 1 : 0
        right = b.added_to_inventory ? 1 : 0
        break
      case 'date':
      default:
        left = dateValue(a)
        right = dateValue(b)
        break
    }

    if (typeof left === 'number' && typeof right === 'number') {
      return (left - right) * direction
    }

    return String(left).localeCompare(String(right)) * direction
  })
})

const toggleSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }
  sortKey.value = key
  sortDirection.value = 'asc'
}

const sortIndicator = (key: SortKey) => {
  if (sortKey.value !== key) {
    return ''
  }
  return sortDirection.value === 'asc' ? '^' : 'v'
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'ETB' }).format(value || 0)
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleDateString(locale.value)
}

onMounted(async () => {
  await loadPermissions()
  if (!store.isLoaded) {
    await store.loadAll()
  }
})
</script>
