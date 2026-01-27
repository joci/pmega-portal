<template>
  <section class="space-y-8">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('maintenance.title') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('maintenance.subtitle') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3 text-sm font-semibold">
        <NuxtLink v-if="canEditMaintenance" :to="localePath('/maintenance/new')">
          <UButton color="primary" size="sm">{{ t('maintenance.new') }}</UButton>
        </NuxtLink>
      </div>
    </div>

    <div v-if="pageMessage" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
      <UAlert :color="pageMessage.type ?? 'primary'" :title="pageMessage.text" />
    </div>

    <div v-if="!canViewMaintenance" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('permissions.noAccess') }}
    </div>

    <div v-else class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('maintenance.listTitle') }}</h2>
        <div class="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            v-model="searchQuery"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:w-64"
            :placeholder="t('maintenance.list.searchPlaceholder')"
          />
        </div>
      </div>

      <div v-if="store.tickets.length === 0" class="mt-6 text-sm text-slate-500">
        {{ t('maintenance.empty') }}
      </div>
      <div v-else class="mt-6 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="text-left text-xs font-semibold uppercase text-slate-500">
            <tr class="border-b border-slate-200">
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('receipt')">
                  {{ t('maintenance.list.receipt') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('receipt') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('customer')">
                  {{ t('maintenance.list.customer') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('customer') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('device')">
                  {{ t('maintenance.list.device') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('device') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('status')">
                  {{ t('maintenance.list.status') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('status') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('priority')">
                  {{ t('maintenance.list.priority') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('priority') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('received')">
                  {{ t('maintenance.list.received') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('received') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('location')">
                  {{ t('maintenance.list.location') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('location') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4 text-right">
                <button type="button" class="ml-auto flex items-center gap-1" @click="toggleSort('total')">
                  {{ t('maintenance.list.total') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('total') }}</span>
                </button>
              </th>
              <th class="py-2 text-right">{{ t('maintenance.list.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="sortedTickets.length === 0">
              <td colspan="9" class="py-6 text-center text-sm text-slate-500">
                {{ t('maintenance.list.noResults') }}
              </td>
            </tr>
            <tr v-for="ticket in sortedTickets" :key="ticket.ticket_id" class="border-b border-slate-100">
              <td class="py-3 pr-4">
                <div class="font-semibold text-slate-900">
                  {{ ticket.receipt_number ?? ticket.ticket_number ?? ticket.ticket_id }}
                </div>
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">
                {{ customerName(ticket) }}
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">
                {{ deviceLabel(ticket) }}
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">
                {{ ticket.status }}
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">
                {{ ticket.priority }}
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">
                {{ formatDate(ticket.received_at ?? ticket.created_at) }}
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">
                {{ locationName(ticket.location_id) }}
              </td>
              <td class="py-3 pr-4 text-right text-sm text-slate-700">
                {{ formatCurrency(ticketTotal(ticket)) }}
              </td>
              <td class="py-3 text-right">
                <div class="flex justify-end gap-2">
                  <NuxtLink :to="localePath(`/maintenance/${ticket.ticket_id}`)">
                    <UButton size="xs" color="gray" variant="outline">{{ t('maintenance.actions.view') }}</UButton>
                  </NuxtLink>
                  <NuxtLink
                    v-if="canEditMaintenance && isTicketEditable(ticket)"
                    :to="localePath({ path: '/maintenance/new', query: { ticket: ticket.ticket_id } })"
                  >
                    <UButton size="xs" color="gray" variant="outline">{{ t('maintenance.actions.edit') }}</UButton>
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
import { useMaintenanceStore } from '~/stores/maintenance'
import { useSettingsStore } from '~/stores/settings'
import { usePermissions } from '~/composables/usePermissions'
import type { MaintenanceTicket, PartRequest } from '~/types/database'
import { useFlashMessage, type FlashMessage } from '~/composables/useFlashMessage'

type SortKey = 'receipt' | 'customer' | 'device' | 'status' | 'priority' | 'received' | 'location' | 'total'

const store = useMaintenanceStore()
const inventoryStore = useInventoryStore()
const settingsStore = useSettingsStore()
const { can, loadPermissions } = usePermissions()
const { locale, t } = useI18n()
const localePath = useLocalePath()

const canViewMaintenance = computed(() => can('maintenance.view'))
const canEditMaintenance = computed(() => can('maintenance.edit'))

const { consumeFlashMessage } = useFlashMessage()
const pageMessage = ref<FlashMessage | null>(null)

const searchQuery = ref('')
const sortKey = ref<SortKey>('received')
const sortDirection = ref<'asc' | 'desc'>('desc')

const customersById = computed(() => new Map(store.customers.map((entry) => [entry.customer_id, entry])))
const devicesById = computed(() => new Map(store.customerDevices.map((entry) => [entry.device_id, entry])))

const customerName = (ticket: MaintenanceTicket) => {
  return customersById.value.get(ticket.customer_id)?.name ?? '-'
}

const deviceLabel = (ticket: MaintenanceTicket) => {
  const device = devicesById.value.get(ticket.customer_device_id)
  if (!device) {
    return '-'
  }
  const label = [device.item_name, device.model].filter(Boolean).join(' • ')
  return label || '-'
}

const locationName = (locationId: string) => {
  return inventoryStore.locations.find((entry) => entry.location_id === locationId)?.name ?? '-'
}

const isTicketEditable = (ticket: MaintenanceTicket) => {
  return !['COMPLETED', 'DELIVERED'].includes(ticket.status)
}

const receivedDateValue = (ticket: MaintenanceTicket) => {
  const value = ticket.received_at ?? ticket.created_at
  return value ? new Date(value).getTime() : 0
}

const vatRate = computed(() => {
  const raw = settingsStore.getSetting('tax_rate')?.setting_value ?? '0'
  const value = Number(raw)
  return Number.isNaN(value) ? 0 : value
})

const unitAmount = (request: PartRequest) => {
  if (request.part_id) {
    const item = inventoryStore.items.find((entry) => entry.item_id === request.part_id)
    if (item?.price != null) {
      const value = Number(item.price)
      return Number.isNaN(value) ? 0 : value
    }
  }
  if (request.external_cost != null) {
    const value = Number(request.external_cost)
    return Number.isNaN(value) ? 0 : value
  }
  return 0
}

const lineTotal = (request: PartRequest) => unitAmount(request) * request.quantity_requested

const partsTotal = (ticketId: string) => {
  return store.partRequests
    .filter((entry) => entry.ticket_id === ticketId)
    .reduce((sum, request) => sum + lineTotal(request), 0)
}

const ticketTotal = (ticket: MaintenanceTicket) => {
  const labor = Number(ticket.labor_cost ?? 0)
  const laborValue = Number.isNaN(labor) ? 0 : labor
  const subtotal = partsTotal(ticket.ticket_id) + laborValue
  return subtotal + subtotal * vatRate.value
}

const filteredTickets = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    return store.tickets
  }
  return store.tickets.filter((ticket) => {
    const fields = [
      ticket.receipt_number ?? ticket.ticket_number ?? ticket.ticket_id,
      customerName(ticket),
      deviceLabel(ticket),
      ticket.status,
      ticket.priority,
      locationName(ticket.location_id)
    ]
    return fields.some((field) => String(field).toLowerCase().includes(query))
  })
})

const sortedTickets = computed(() => {
  const items = [...filteredTickets.value]
  const direction = sortDirection.value === 'asc' ? 1 : -1

  return items.sort((a, b) => {
    let left: string | number = ''
    let right: string | number = ''

    switch (sortKey.value) {
      case 'receipt':
        left = a.receipt_number ?? a.ticket_number ?? a.ticket_id
        right = b.receipt_number ?? b.ticket_number ?? b.ticket_id
        break
      case 'customer':
        left = customerName(a)
        right = customerName(b)
        break
      case 'device':
        left = deviceLabel(a)
        right = deviceLabel(b)
        break
      case 'status':
        left = a.status
        right = b.status
        break
      case 'priority':
        left = a.priority
        right = b.priority
        break
      case 'location':
        left = locationName(a.location_id)
        right = locationName(b.location_id)
        break
      case 'total':
        left = ticketTotal(a)
        right = ticketTotal(b)
        break
      case 'received':
      default:
        left = receivedDateValue(a)
        right = receivedDateValue(b)
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

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleDateString(locale.value)
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'ETB' }).format(value || 0)
}

onMounted(async () => {
  await loadPermissions()
  pageMessage.value = consumeFlashMessage()
  if (!inventoryStore.isLoaded) {
    await inventoryStore.loadAll()
  }
  if (!settingsStore.isLoaded) {
    await settingsStore.loadAll()
  }
  if (!store.isLoaded) {
    await store.loadAll()
  }
})
</script>
