<template>
  <section class="space-y-8">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('maintenance.detail.title') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('maintenance.detail.subtitle') }}</p>
      </div>
      <NuxtLink :to="localePath('/maintenance')" class="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
        {{ t('maintenance.backToList') }}
      </NuxtLink>
    </div>

    <div v-if="!canViewMaintenance" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('permissions.noAccess') }}
    </div>

    <div
      v-else-if="!maintenanceStore.isLoaded"
      class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500"
    >
      {{ t('maintenance.detail.loading') }}
    </div>

    <div v-else-if="!ticket" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('maintenance.detail.notFound') }}
    </div>

    <div v-else class="space-y-6">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">{{ t('maintenance.detail.summaryTitle') }}</h2>
        </div>

        <div class="mt-4 grid gap-4 text-sm text-slate-700 md:grid-cols-3">
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.receiptNumber') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ ticket.receipt_number ?? ticket.ticket_number ?? ticket.ticket_id }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('maintenance.fields.receiptAttachment') }}
            </label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ ticket.receipt_attachment || '-' }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.receivedDate') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ formatDate(ticket.received_at ?? ticket.created_at) }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.status') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ ticket.status }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.priority') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ ticket.priority }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.location') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ locationName(ticket.location_id) }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.technician') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ ticket.technician_id || '-' }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('maintenance.fields.targetDeliveryDate') }}
            </label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ formatDate(ticket.target_delivery_at) }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('maintenance.fields.actualDeliveredDate') }}
            </label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ formatDate(ticket.delivered_at) }}
            </div>
          </div>
        </div>

        <div class="mt-6">
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.attachments') }}</label>
          <div v-if="ticketAttachments.length === 0" class="mt-1 text-sm text-slate-500">-</div>
          <div v-else class="mt-2 space-y-2">
            <a
              v-for="attachment in ticketAttachments"
              :key="attachment.attachment_id"
              :href="attachment.data_url"
              target="_blank"
              rel="noopener"
              class="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:text-emerald-600 hover:underline"
            >
              {{ attachment.file_name }}
            </a>
          </div>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.customerName') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ customer?.name ?? '-' }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('maintenance.fields.customerNameAmharic') }}
            </label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ customer?.name_amharic ?? '-' }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.customerPhone') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ customer?.phone ?? '-' }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.customerTin') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ customer?.tin ?? '-' }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('maintenance.fields.customerVatRegistration') }}
            </label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ customer?.vat_registration_no ?? '-' }}
            </div>
          </div>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.itemName') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ device?.item_name ?? '-' }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.deviceModel') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ device?.model ?? '-' }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.serial') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ device?.serial_number ?? '-' }}
            </div>
          </div>
        </div>

        <div class="mt-6">
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.problem') }}</label>
          <textarea
            :value="ticket.problem_description"
            rows="3"
            readonly
            class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          />
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">{{ t('maintenance.detail.partsTitle') }}</h2>
        </div>

        <div v-if="ticketPartRequests.length === 0" class="mt-4 text-sm text-slate-500">
          {{ t('maintenance.parts.emptyTicket') }}
        </div>
        <div v-else class="mt-4 overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="text-left text-xs font-semibold uppercase text-slate-500">
              <tr class="border-b border-slate-200">
                <th class="py-2 pr-4">{{ t('maintenance.parts.columns.item') }}</th>
                <th class="py-2 pr-4">{{ t('maintenance.parts.columns.source') }}</th>
                <th class="py-2 pr-4">{{ t('maintenance.parts.columns.quantity') }}</th>
                <th class="py-2 pr-4">{{ t('maintenance.parts.columns.unitPrice') }}</th>
                <th class="py-2 pr-4">{{ t('maintenance.parts.columns.lineTotal') }}</th>
                <th class="py-2 pr-4">{{ t('maintenance.parts.columns.status') }}</th>
                <th class="py-2 pr-4">{{ t('maintenance.parts.columns.requestedBy') }}</th>
                <th class="py-2 pr-4">{{ t('maintenance.parts.columns.requestedAt') }}</th>
                <th class="py-2 pr-4">{{ t('maintenance.parts.columns.receipt') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="request in ticketPartRequests" :key="request.request_id" class="border-b border-slate-100">
                <td class="py-3 pr-4">
                  <div class="font-semibold text-slate-900">{{ partName(request) }}</div>
                  <div v-if="partModel(request)" class="text-xs text-slate-500">{{ partModel(request) }}</div>
                </td>
                <td class="py-3 pr-4 text-sm text-slate-700">{{ sourceLabel(request.source_preference) }}</td>
                <td class="py-3 pr-4 text-sm text-slate-700">{{ request.quantity_requested }}</td>
                <td class="py-3 pr-4 text-sm text-slate-700">
                  {{ formatAmount(unitAmount(request)) }}
                </td>
                <td class="py-3 pr-4 text-sm text-slate-700">
                  {{ formatAmount(lineTotal(request)) }}
                </td>
                <td class="py-3 pr-4 text-sm text-slate-700">{{ request.status }}</td>
                <td class="py-3 pr-4 text-sm text-slate-700">{{ request.requested_by }}</td>
                <td class="py-3 pr-4 text-sm text-slate-700">
                  {{ formatDate(request.requested_at) }}
                </td>
                <td class="py-3 pr-4 text-sm text-slate-700">
                  {{ request.external_receipt_number || '-' }}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="mt-4 flex justify-end">
            <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-right">
              <div class="text-[11px] font-semibold uppercase text-slate-500">
                {{ t('maintenance.parts.totalLabel') }}
              </div>
              <div class="text-base font-semibold text-slate-900">
                {{ formatCurrency(totalPartsAmount) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">{{ t('maintenance.detail.totalsTitle') }}</h2>
        </div>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.totals.parts') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ formatCurrency(totalPartsAmount) }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.totals.labor') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ formatCurrency(laborCostValue) }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.totals.subtotal') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ formatCurrency(partsSubtotal) }}
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('maintenance.totals.vat') }} ({{ (vatRate * 100).toFixed(0) }}%)
            </label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {{ formatCurrency(vatAmount) }}
            </div>
          </div>
          <div class="md:col-span-2">
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.totals.total') }}</label>
            <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900">
              {{ formatCurrency(totalWithVat) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { useMaintenanceStore } from '~/stores/maintenance'
import { useSettingsStore } from '~/stores/settings'
import { usePermissions } from '~/composables/usePermissions'
import type { MaintenanceAttachment, PartRequest } from '~/types/database'

const route = useRoute()
const maintenanceStore = useMaintenanceStore()
const inventoryStore = useInventoryStore()
const settingsStore = useSettingsStore()
const { can, loadPermissions } = usePermissions()
const { locale, t } = useI18n()
const localePath = useLocalePath()

const canViewMaintenance = computed(() => can('maintenance.view'))
const ticketId = computed(() => String(route.params.ticketId || ''))

const ticket = computed(() => maintenanceStore.tickets.find((entry) => entry.ticket_id === ticketId.value))
const customer = computed(() =>
  ticket.value ? maintenanceStore.customers.find((entry) => entry.customer_id === ticket.value?.customer_id) : null
)
const device = computed(() =>
  ticket.value
    ? maintenanceStore.customerDevices.find((entry) => entry.device_id === ticket.value?.customer_device_id)
    : null
)

const ticketPartRequests = computed(() =>
  maintenanceStore.partRequests.filter((entry) => entry.ticket_id === ticketId.value)
)
const ticketAttachments = computed<MaintenanceAttachment[]>(() =>
  maintenanceStore.attachments.filter((entry) => entry.ticket_id === ticketId.value)
)

const locationName = (locationId: string) => {
  return inventoryStore.locations.find((entry) => entry.location_id === locationId)?.name ?? '-'
}

const partName = (request: PartRequest) => {
  if (request.part_id) {
    return inventoryStore.items.find((item) => item.item_id === request.part_id)?.name ?? '-'
  }
  return request.external_item_name ?? '-'
}

const partModel = (request: PartRequest) => {
  if (request.part_id) {
    const item = inventoryStore.items.find((entry) => entry.item_id === request.part_id)
    return item?.model ?? ''
  }
  return request.external_model ?? ''
}

const unitAmount = (request: PartRequest) => {
  if (request.part_id) {
    const item = inventoryStore.items.find((entry) => entry.item_id === request.part_id)
    if (item?.price != null) {
      const value = Number(item.price)
      return Number.isNaN(value) ? null : value
    }
  }
  if (request.external_cost != null) {
    const value = Number(request.external_cost)
    return Number.isNaN(value) ? null : value
  }
  return null
}

const lineTotal = (request: PartRequest) => {
  const unit = unitAmount(request)
  if (unit == null) {
    return null
  }
  return unit * request.quantity_requested
}

const formatAmount = (value: number | null) => {
  if (value == null) {
    return '-'
  }
  return formatCurrency(value)
}

const totalPartsAmount = computed(() =>
  ticketPartRequests.value.reduce((sum, request) => {
    const total = lineTotal(request)
    return sum + (total ?? 0)
  }, 0)
)

const vatRate = computed(() => {
  const raw = settingsStore.getSetting('tax_rate')?.setting_value ?? '0'
  const value = Number(raw)
  return Number.isNaN(value) ? 0 : value
})

const laborCostValue = computed(() => {
  const value = Number(ticket.value?.labor_cost ?? 0)
  return Number.isNaN(value) ? 0 : Math.max(0, value)
})

const partsSubtotal = computed(() => totalPartsAmount.value + laborCostValue.value)
const vatAmount = computed(() => partsSubtotal.value * vatRate.value)
const totalWithVat = computed(() => partsSubtotal.value + vatAmount.value)

const sourceLabel = (source: PartRequest['source_preference']) => {
  switch (source) {
    case 'EXTERNAL_SUPPLIER':
      return t('maintenance.partRequest.sourceExternal')
    case 'CUSTOMER_SUPPLIED':
      return t('maintenance.partRequest.sourceCustomer')
    case 'STORE_INVENTORY':
    default:
      return t('maintenance.partRequest.sourceStore')
  }
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
  if (!inventoryStore.isLoaded) {
    await inventoryStore.loadAll()
  }
  if (!settingsStore.isLoaded) {
    await settingsStore.loadAll()
  }
  if (!maintenanceStore.isLoaded) {
    await maintenanceStore.loadAll()
  }
})
</script>
