<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">{{ t('reports.title') }}</h1>
      <p class="text-sm text-slate-600">{{ t('reports.subtitle') }}</p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="text-xs font-semibold uppercase text-slate-400">{{ t('reports.cards.items') }}</div>
        <div class="mt-3 text-2xl font-semibold text-slate-900">{{ totalItems }}</div>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="text-xs font-semibold uppercase text-slate-400">{{ t('reports.cards.lowStock') }}</div>
        <div class="mt-3 text-2xl font-semibold text-slate-900">{{ lowStockCount }}</div>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="text-xs font-semibold uppercase text-slate-400">{{ t('reports.cards.salesTotal') }}</div>
        <div class="mt-3 text-2xl font-semibold text-slate-900">{{ formatCurrency(totalSales) }}</div>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="text-xs font-semibold uppercase text-slate-400">{{ t('reports.cards.openTickets') }}</div>
        <div class="mt-3 text-2xl font-semibold text-slate-900">{{ openTickets }}</div>
      </div>
    </div>

    <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
      {{ t('reports.placeholder') }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { useMaintenanceStore } from '~/stores/maintenance'
import { useSalesStore } from '~/stores/sales'

const inventoryStore = useInventoryStore()
const salesStore = useSalesStore()
const maintenanceStore = useMaintenanceStore()
const { locale, t } = useI18n()

const totalItems = computed(() => inventoryStore.items.length)

const itemMinStock = computed(() => {
  const map = new Map<string, number>()
  for (const item of inventoryStore.items) {
    map.set(item.item_id, item.min_stock_level)
  }
  return map
})

const lowStockCount = computed(() => {
  return inventoryStore.inventory.filter((entry) => {
    const min = itemMinStock.value.get(entry.item_id) ?? 0
    return entry.quantity <= min
  }).length
})

const totalSales = computed(() => {
  return salesStore.sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)
})

const openTickets = computed(() => {
  return maintenanceStore.tickets.filter((ticket) =>
    !['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(ticket.status)
  ).length
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'USD' }).format(value || 0)
}

onMounted(async () => {
  if (!inventoryStore.isLoaded) {
    await inventoryStore.loadAll()
  }
  if (!salesStore.isLoaded) {
    await salesStore.loadAll()
  }
  if (!maintenanceStore.isLoaded) {
    await maintenanceStore.loadAll()
  }
})
</script>
