<template>
  <section class="space-y-8">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('sales.title') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('sales.subtitle') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3 text-sm font-semibold">
        <NuxtLink v-if="canCreateSales" :to="localePath('/sales/new')">
          <UButton color="primary" size="sm">{{ t('sales.new') }}</UButton>
        </NuxtLink>
      </div>
    </div>

    <div v-if="pageMessage" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
      <UAlert :color="pageMessage.type ?? 'primary'" :title="pageMessage.text" />
    </div>

    <div v-if="!canViewSales" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('permissions.noAccess') }}
    </div>

    <div v-else class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('sales.listTitle') }}</h2>
        <div class="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            v-model="searchQuery"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:w-64"
            :placeholder="t('sales.list.searchPlaceholder')"
          />
        </div>
      </div>

      <div v-if="store.sales.length === 0" class="mt-6 text-sm text-slate-500">
        {{ t('sales.empty') }}
      </div>
      <div v-else class="mt-6 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="text-left text-xs font-semibold uppercase text-slate-500">
            <tr class="border-b border-slate-200">
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('number')">
                  {{ t('sales.list.saleNumber') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('number') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('customer')">
                  {{ t('sales.list.customer') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('customer') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('date')">
                  {{ t('sales.list.date') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('date') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('type')">
                  {{ t('sales.list.type') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('type') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('status')">
                  {{ t('sales.list.status') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('status') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('location')">
                  {{ t('sales.list.location') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('location') }}</span>
                </button>
              </th>
              <th class="py-2 text-right">
                <button type="button" class="ml-auto flex items-center gap-1" @click="toggleSort('total')">
                  {{ t('sales.list.total') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('total') }}</span>
                </button>
              </th>
              <th class="py-2 text-right">{{ t('sales.list.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="sortedSales.length === 0">
              <td colspan="8" class="py-6 text-center text-sm text-slate-500">
                {{ t('sales.list.noResults') }}
              </td>
            </tr>
            <tr v-for="sale in sortedSales" :key="sale.sale_id" class="border-b border-slate-100">
              <td class="py-3 pr-4">
                <div class="font-semibold text-slate-900">{{ sale.sale_number ?? sale.sale_id }}</div>
                <div v-if="sale.customer_id" class="text-xs text-slate-500">
                  {{ sale.customer_id }}
                </div>
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">
                <div class="font-semibold text-slate-900">{{ sale.customer_name || '-' }}</div>
                <div v-if="sale.customer_phone" class="text-xs text-slate-500">
                  {{ sale.customer_phone }}
                </div>
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">
                {{ formatDate(sale.sale_date ?? sale.created_at) }}
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">{{ saleTypeLabel(sale.sale_type) }}</td>
              <td class="py-3 pr-4 text-sm text-slate-700">
                <div class="font-semibold text-slate-800">{{ sale.status }}</div>
                <div class="text-xs text-slate-500">{{ sale.payment_status }}</div>
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">{{ locationName(sale.location_id) }}</td>
              <td class="py-3 pr-4 text-right text-sm text-slate-700">{{ formatCurrency(sale.total_amount) }}</td>
              <td class="py-3 text-right">
                <div class="flex justify-end gap-2">
                  <NuxtLink :to="localePath(`/sales/${sale.sale_id}`)">
                    <UButton size="xs" color="gray" variant="outline">{{ t('sales.list.view') }}</UButton>
                  </NuxtLink>
                  <NuxtLink
                    v-if="canEditSale(sale)"
                    :to="localePath({ path: '/sales/new', query: { sale: sale.sale_id } })"
                  >
                    <UButton size="xs" color="primary" variant="outline">{{ t('sales.list.edit') }}</UButton>
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
import { useSalesStore } from '~/stores/sales'
import { usePermissions } from '~/composables/usePermissions'
import { useAuth } from '~/composables/useAuth'
import type { Sale } from '~/types/database'
import { useFlashMessage, type FlashMessage } from '~/composables/useFlashMessage'

type SortKey = 'number' | 'customer' | 'date' | 'type' | 'status' | 'location' | 'total'

const store = useSalesStore()
const inventoryStore = useInventoryStore()
const { can, loadPermissions } = usePermissions()
const { user } = useAuth()
const { locale, t } = useI18n()
const localePath = useLocalePath()

const canViewSales = computed(() => can('sales.view'))
const canCreateSales = computed(() => can('sales.create'))
const isAdmin = computed(() => user.value?.role === 'admin')

const { consumeFlashMessage } = useFlashMessage()
const pageMessage = ref<FlashMessage | null>(null)

const searchQuery = ref('')
const sortKey = ref<SortKey>('date')
const sortDirection = ref<'asc' | 'desc'>('desc')

const locationName = (locationId: string) => {
  return inventoryStore.locations.find((entry) => entry.location_id === locationId)?.name ?? '-'
}

const saleDateValue = (sale: Sale) => {
  const value = sale.sale_date ?? sale.created_at
  return value ? new Date(value).getTime() : 0
}

const saleTypeLabel = (value: Sale['sale_type']) => {
  switch (value) {
    case 'MAINTENANCE':
      return t('sales.options.maintenance')
    case 'INTERNAL':
      return t('sales.options.internal')
    case 'RETAIL':
    default:
      return t('sales.options.retail')
  }
}

const filteredSales = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    return store.sales
  }
  return store.sales.filter((sale) => {
    const fields = [
      sale.sale_number ?? sale.sale_id,
      sale.customer_id ?? '',
      sale.customer_name ?? '',
      sale.customer_phone ?? '',
      sale.customer_tin ?? '',
      sale.status,
      sale.payment_status,
      sale.sale_type,
      sale.notes ?? '',
      locationName(sale.location_id)
    ]
    return fields.some((field) => String(field).toLowerCase().includes(query))
  })
})

const canEditSale = (sale: Sale) => {
  if (!canCreateSales.value) {
    return false
  }
  return sale.status !== 'COMPLETED' || isAdmin.value
}

const sortedSales = computed(() => {
  const items = [...filteredSales.value]
  const direction = sortDirection.value === 'asc' ? 1 : -1

  return items.sort((a, b) => {
    let left: string | number = ''
    let right: string | number = ''

    switch (sortKey.value) {
      case 'number':
        left = a.sale_number ?? a.sale_id
        right = b.sale_number ?? b.sale_id
        break
      case 'customer':
        left = a.customer_name ?? ''
        right = b.customer_name ?? ''
        break
      case 'type':
        left = saleTypeLabel(a.sale_type)
        right = saleTypeLabel(b.sale_type)
        break
      case 'status':
        left = a.status
        right = b.status
        break
      case 'location':
        left = locationName(a.location_id)
        right = locationName(b.location_id)
        break
      case 'total':
        left = a.total_amount
        right = b.total_amount
        break
      case 'date':
      default:
        left = saleDateValue(a)
        right = saleDateValue(b)
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
  pageMessage.value = consumeFlashMessage()
  if (!inventoryStore.isLoaded) {
    await inventoryStore.loadAll()
  }
  if (!store.isLoaded) {
    await store.loadAll()
  }
})
</script>
