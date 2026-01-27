<template>
  <section class="space-y-8">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('maintenance.parts.title') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('maintenance.parts.subtitle') }}</p>
      </div>
    </div>

    <div v-if="!canViewMaintenance" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('permissions.noAccess') }}
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-slate-900">{{ t('maintenance.parts.formTitle') }}</h2>
          <div
            class="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
          >
            <button
              type="button"
              class="rounded-full px-3 py-1"
              :class="partRequestMode === 'internal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
              @click="partRequestMode = 'internal'"
            >
              {{ t('maintenance.partRequest.tabs.internal') }}
            </button>
            <button
              type="button"
              class="rounded-full px-3 py-1"
              :class="partRequestMode === 'external' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
              @click="partRequestMode = 'external'"
            >
              {{ t('maintenance.partRequest.tabs.external') }}
            </button>
          </div>
        </div>

        <div v-if="partRequestMessage" class="mt-4">
          <UAlert :color="partRequestMessage.type" :title="partRequestMessage.text" />
        </div>

        <div class="mt-4">
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('maintenance.parts.selectTicket') }}
          </label>
          <select
            v-model="selectedTicketId"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">{{ t('maintenance.parts.ticketPlaceholder') }}</option>
            <option v-for="ticket in ticketOptions" :key="ticket.ticket_id" :value="ticket.ticket_id">
              {{ ticketLabel(ticket) }}
            </option>
          </select>
        </div>

        <div v-if="selectedTicket" class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
          <div class="grid gap-3 md:grid-cols-2">
            <div>
              <div class="font-semibold text-slate-500">{{ t('maintenance.parts.ticketReceipt') }}</div>
              <div class="text-slate-900">
                {{ selectedTicket.receipt_number ?? selectedTicket.ticket_number ?? selectedTicket.ticket_id }}
              </div>
            </div>
            <div>
              <div class="font-semibold text-slate-500">{{ t('maintenance.parts.ticketStatus') }}</div>
              <div class="text-slate-900">{{ selectedTicket.status }}</div>
            </div>
            <div>
              <div class="font-semibold text-slate-500">{{ t('maintenance.parts.ticketCustomer') }}</div>
              <div class="text-slate-900">{{ selectedCustomer?.name ?? '-' }}</div>
            </div>
            <div>
              <div class="font-semibold text-slate-500">{{ t('maintenance.parts.ticketDevice') }}</div>
              <div class="text-slate-900">{{ selectedDeviceLabel }}</div>
            </div>
            <div>
              <div class="font-semibold text-slate-500">{{ t('maintenance.parts.ticketLocation') }}</div>
              <div class="text-slate-900">{{ locationName(selectedTicket.location_id) }}</div>
            </div>
            <div>
              <div class="font-semibold text-slate-500">{{ t('maintenance.fields.technician') }}</div>
              <div class="text-slate-900">{{ partRequestForm.technician_id || '-' }}</div>
            </div>
          </div>
        </div>

        <div v-if="!selectedTicket" class="mt-4 text-sm text-slate-500">
          {{ t('maintenance.partRequest.selectTicket') }}
        </div>

        <form v-else class="mt-4 space-y-4" @submit.prevent="submitPartRequest">
          <div v-if="partRequestMode === 'internal'" class="space-y-4">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.partRequest.part') }}</label>
              <div class="relative mt-1">
                <input
                  v-model="partRequestForm.part_query"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  :placeholder="t('maintenance.partRequest.selectPart')"
                  @focus="openPartMenu"
                  @input="handlePartInput"
                  @keydown.enter.prevent="selectFirstPartMatch"
                  @keydown.escape="closePartMenu"
                  @blur="scheduleClosePartMenu"
                />
                <div
                  v-if="isPartMenuOpen"
                  class="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                >
                  <div v-if="filteredParts.length === 0" class="px-3 py-2 text-xs text-slate-500">
                    {{ t('maintenance.partRequest.noPartMatches') }}
                  </div>
                  <div v-else class="max-h-64 overflow-auto">
                    <button
                      v-for="item in filteredParts"
                      :key="item.item_id"
                      type="button"
                      class="flex w-full flex-col gap-1 px-3 py-2 text-left text-sm hover:bg-slate-50"
                      @mousedown.prevent="selectPart(item)"
                    >
                      <span class="font-semibold text-slate-900">{{ partLabel(item) }}</span>
                      <span class="text-xs text-slate-500">{{ formatCurrency(Number(item.price ?? 0)) }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('maintenance.partRequest.inventoryPrice') }}
                </label>
                <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {{ selectedPartPrice }}
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('maintenance.partRequest.lineTotal') }}
                </label>
                <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {{ selectedPartLineTotal }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('maintenance.partRequest.externalItemName') }}
                </label>
                <input
                  v-model="partRequestForm.external_item_name"
                  class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('maintenance.partRequest.externalModel') }}
                </label>
                <input
                  v-model="partRequestForm.external_model"
                  class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.partRequest.receiptNumber') }}
                  </label>
                <input
                  v-model="partRequestForm.external_receipt_number"
                  class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('maintenance.partRequest.externalCost') }}
                </label>
                  <input
                    v-model.number="partRequestForm.external_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('maintenance.partRequest.lineTotal') }}
                </label>
                <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {{ externalLineTotal }}
                </div>
              </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('maintenance.partRequest.quantity') }}
              </label>
              <input
                v-model.number="partRequestForm.quantity_requested"
                type="number"
                min="1"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('maintenance.partRequest.requestedBy') }}
              </label>
              <input
                v-model="partRequestForm.requested_by"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('maintenance.fields.technician') }}
              </label>
              <input
                v-model="partRequestForm.technician_id"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('maintenance.partRequest.status') }}
              </label>
              <select
                v-model="partRequestForm.status"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="REQUESTED">{{ t('maintenance.partRequest.statusRequested') }}</option>
                <option value="APPROVED">{{ t('maintenance.partRequest.statusApproved') }}</option>
                <option value="REJECTED">{{ t('maintenance.partRequest.statusRejected') }}</option>
                <option value="FULFILLED">{{ t('maintenance.partRequest.statusFulfilled') }}</option>
                <option value="CANCELLED">{{ t('maintenance.partRequest.statusCancelled') }}</option>
              </select>
            </div>
          </div>

          <div v-if="partRequestMode === 'external'" class="space-y-2">
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('maintenance.partRequest.receiptAttachment') }}
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              @change="handleExternalReceipt"
            />
            <div class="text-xs text-slate-500">
              {{ t('maintenance.partRequest.receiptAttachmentHelper') }}
            </div>
            <div v-if="partRequestForm.external_receipt_file_name" class="flex items-center gap-2 text-xs">
              <span class="text-slate-600">
                {{ t('maintenance.partRequest.receiptSelected') }}: {{ partRequestForm.external_receipt_file_name }}
              </span>
              <UButton size="xs" color="gray" variant="outline" @click="clearExternalReceipt">
                {{ t('maintenance.partRequest.receiptClear') }}
              </UButton>
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('maintenance.partRequest.notes') }}
            </label>
            <textarea
              v-model="partRequestForm.notes"
              rows="2"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div class="flex flex-wrap gap-3">
            <UButton type="submit" color="primary" :disabled="!canRequestParts">
              {{ t('maintenance.partRequest.submit') }}
            </UButton>
            <UButton type="button" color="gray" variant="outline" @click="resetPartRequestForm">
              {{ t('maintenance.partRequest.clear') }}
            </UButton>
          </div>
        </form>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 class="text-lg font-semibold text-slate-900">{{ listTitle }}</h2>
          <input
            v-model="searchQuery"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:w-64"
            :placeholder="t('maintenance.parts.searchPlaceholder')"
          />
        </div>

        <div v-if="sortedRequests.length === 0" class="mt-6 text-sm text-slate-500">
          {{ searchQuery ? t('maintenance.parts.noResults') : t('maintenance.parts.empty') }}
        </div>
        <div v-else class="mt-6 overflow-x-auto">
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
              <tr v-for="request in sortedRequests" :key="request.request_id" class="border-b border-slate-100">
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
          <div v-if="selectedTicketId" class="mt-4 flex justify-end">
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { useMaintenanceStore } from '~/stores/maintenance'
import { usePermissions } from '~/composables/usePermissions'
import type { Item, MaintenanceTicket, PartRequest } from '~/types/database'

const store = useMaintenanceStore()
const inventoryStore = useInventoryStore()
const { can, loadPermissions } = usePermissions()
const { locale, t } = useI18n()
const route = useRoute()

const canViewMaintenance = computed(() => can('maintenance.view'))
const canRequestParts = computed(() => can('maintenance.parts.request'))

const selectedTicketId = ref('')
const searchQuery = ref('')
const partRequestMode = ref<'internal' | 'external'>('internal')
const partRequestMessage = ref<{ type: 'primary' | 'red'; text: string } | null>(null)
const maxPartMatches = 12
const isPartMenuOpen = ref(false)

const partRequestForm = reactive({
  part_id: '',
  part_query: '',
  quantity_requested: 1,
  requested_by: '',
  technician_id: '',
  status: 'REQUESTED' as const,
  notes: '',
  external_item_name: '',
  external_model: '',
  external_cost: 0,
  external_receipt_number: '',
  external_receipt_data_url: '',
  external_receipt_file_name: '',
  external_receipt_file_type: '',
  external_receipt_file_size: 0
})

const customersById = computed(() => new Map(store.customers.map((entry) => [entry.customer_id, entry])))
const devicesById = computed(() => new Map(store.customerDevices.map((entry) => [entry.device_id, entry])))
const itemsById = computed(() => new Map(inventoryStore.items.map((entry) => [entry.item_id, entry])))

const selectedTicket = computed(() =>
  store.tickets.find((entry) => entry.ticket_id === selectedTicketId.value)
)
const selectedCustomer = computed(() =>
  selectedTicket.value ? customersById.value.get(selectedTicket.value.customer_id) : null
)
const selectedDevice = computed(() =>
  selectedTicket.value ? devicesById.value.get(selectedTicket.value.customer_device_id) : null
)

const selectedDeviceLabel = computed(() => {
  if (!selectedDevice.value) {
    return '-'
  }
  const label = [selectedDevice.value.item_name, selectedDevice.value.model].filter(Boolean).join(' • ')
  return label || '-'
})

const ticketLabel = (ticket: MaintenanceTicket) => {
  const receipt = ticket.receipt_number ?? ticket.ticket_number ?? ticket.ticket_id
  const customer = customersById.value.get(ticket.customer_id)?.name ?? ''
  const device = (() => {
    const entry = devicesById.value.get(ticket.customer_device_id)
    if (!entry) {
      return ''
    }
    return [entry.item_name, entry.model].filter(Boolean).join(' • ')
  })()
  return [receipt, customer, device].filter(Boolean).join(' • ')
}

const ticketOptions = computed(() =>
  [...store.tickets].sort((a, b) => {
    const left = a.received_at ?? a.created_at ?? ''
    const right = b.received_at ?? b.created_at ?? ''
    return String(right).localeCompare(String(left))
  })
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

const partLabel = (item: Item) => {
  const base = [item.name, item.model].filter(Boolean).join(' • ')
  const sku = item.sku ? ` (${item.sku})` : ''
  return `${base}${sku}`.trim()
}

const partSearchText = (item: Item) => {
  return [item.name, item.model, item.sku, item.vendor_sku, item.barcode].filter(Boolean).join(' ').toLowerCase()
}

const sortedParts = computed(() => {
  return [...inventoryStore.items].sort((a, b) => partLabel(a).localeCompare(partLabel(b)))
})

const filteredParts = computed(() => {
  const query = partRequestForm.part_query.trim().toLowerCase()
  if (!query) {
    return sortedParts.value.slice(0, maxPartMatches)
  }
  return sortedParts.value.filter((item) => partSearchText(item).includes(query)).slice(0, maxPartMatches)
})

const selectedPartUnitAmount = computed(() => {
  if (!partRequestForm.part_id) {
    return null
  }
  const item = itemsById.value.get(partRequestForm.part_id)
  if (!item || item.price == null) {
    return null
  }
  const value = Number(item.price)
  return Number.isNaN(value) ? null : value
})

const selectedPartPrice = computed(() => formatAmount(selectedPartUnitAmount.value))

const selectedPartLineTotal = computed(() => {
  if (selectedPartUnitAmount.value == null || partRequestForm.quantity_requested <= 0) {
    return '-'
  }
  return formatCurrency(selectedPartUnitAmount.value * partRequestForm.quantity_requested)
})

const externalLineTotal = computed(() => {
  if (partRequestForm.external_cost <= 0 || partRequestForm.quantity_requested <= 0) {
    return '-'
  }
  return formatCurrency(partRequestForm.external_cost * partRequestForm.quantity_requested)
})

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

const ticketRequests = computed(() =>
  selectedTicketId.value
    ? store.partRequests.filter((entry) => entry.ticket_id === selectedTicketId.value)
    : []
)

const totalPartsAmount = computed(() =>
  ticketRequests.value.reduce((sum, request) => {
    const total = lineTotal(request)
    return sum + (total ?? 0)
  }, 0)
)

const filteredRequests = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const byTicket = selectedTicketId.value
    ? store.partRequests.filter((entry) => entry.ticket_id === selectedTicketId.value)
    : store.partRequests
  if (!query) {
    return byTicket
  }
  return byTicket.filter((entry) => {
    const fields = [
      partName(entry),
      entry.external_receipt_number ?? '',
      entry.requested_by,
      entry.status,
      sourceLabel(entry.source_preference)
    ]
    return fields.some((field) => String(field).toLowerCase().includes(query))
  })
})

const sortedRequests = computed(() => {
  const items = [...filteredRequests.value]
  return items.sort((a, b) => {
    const left = a.requested_at ?? ''
    const right = b.requested_at ?? ''
    return String(right).localeCompare(String(left))
  })
})

const listTitle = computed(() =>
  selectedTicketId.value ? t('maintenance.parts.listTitleTicket') : t('maintenance.parts.listTitleAll')
)

const resetPartRequestForm = () => {
  partRequestForm.part_id = ''
  partRequestForm.part_query = ''
  partRequestForm.quantity_requested = 1
  partRequestForm.requested_by = ''
  partRequestForm.technician_id = selectedTicket.value?.technician_id ?? ''
  partRequestForm.status = 'REQUESTED'
  partRequestForm.notes = ''
  partRequestForm.external_item_name = ''
  partRequestForm.external_model = ''
  partRequestForm.external_cost = 0
  partRequestForm.external_receipt_number = ''
  partRequestForm.external_receipt_data_url = ''
  partRequestForm.external_receipt_file_name = ''
  partRequestForm.external_receipt_file_type = ''
  partRequestForm.external_receipt_file_size = 0
  partRequestMode.value = 'internal'
  partRequestMessage.value = null
  isPartMenuOpen.value = false
}

const handleExternalReceipt = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    partRequestForm.external_receipt_data_url = ''
    partRequestForm.external_receipt_file_name = ''
    partRequestForm.external_receipt_file_type = ''
    partRequestForm.external_receipt_file_size = 0
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    partRequestMessage.value = { type: 'red', text: t('maintenance.partRequest.receiptTooLarge') }
    input.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    partRequestForm.external_receipt_data_url = String(reader.result ?? '')
    partRequestForm.external_receipt_file_name = file.name
    partRequestForm.external_receipt_file_type = file.type
    partRequestForm.external_receipt_file_size = file.size
  }
  reader.readAsDataURL(file)
}

const clearExternalReceipt = () => {
  partRequestForm.external_receipt_data_url = ''
  partRequestForm.external_receipt_file_name = ''
  partRequestForm.external_receipt_file_type = ''
  partRequestForm.external_receipt_file_size = 0
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

const openPartMenu = () => {
  isPartMenuOpen.value = true
}

const closePartMenu = () => {
  isPartMenuOpen.value = false
}

const scheduleClosePartMenu = () => {
  if (!process.client) {
    return
  }
  window.setTimeout(() => {
    isPartMenuOpen.value = false
  }, 150)
}

const handlePartInput = () => {
  openPartMenu()
  const query = partRequestForm.part_query.trim()
  if (!query) {
    partRequestForm.part_id = ''
    return
  }
  const item = partRequestForm.part_id ? itemsById.value.get(partRequestForm.part_id) : null
  if (item && partLabel(item).toLowerCase() !== query.toLowerCase()) {
    partRequestForm.part_id = ''
  }
}

const selectPart = (item: Item) => {
  partRequestForm.part_id = item.item_id
  partRequestForm.part_query = partLabel(item)
  isPartMenuOpen.value = false
}

const selectFirstPartMatch = () => {
  if (!partRequestForm.part_query.trim()) {
    return
  }
  if (filteredParts.value.length > 0) {
    selectPart(filteredParts.value[0])
  }
}

const syncPartQuery = () => {
  if (!partRequestForm.part_id) {
    return
  }
  const item = itemsById.value.get(partRequestForm.part_id)
  if (!item) {
    return
  }
  const label = partLabel(item)
  if (!partRequestForm.part_query || partRequestForm.part_query.toLowerCase() !== label.toLowerCase()) {
    partRequestForm.part_query = label
  }
}

const submitPartRequest = async () => {
  partRequestMessage.value = null
  if (!canRequestParts.value) {
    partRequestMessage.value = { type: 'red', text: t('permissions.readOnly') }
    return
  }
  if (!selectedTicket.value) {
    partRequestMessage.value = { type: 'red', text: t('maintenance.messages.partRequestTicketRequired') }
    return
  }
  if (partRequestMode.value === 'internal' && !partRequestForm.part_id) {
    partRequestMessage.value = { type: 'red', text: t('maintenance.messages.partRequired') }
    return
  }
  if (!partRequestForm.requested_by.trim()) {
    partRequestMessage.value = { type: 'red', text: t('maintenance.messages.requestedByRequired') }
    return
  }
  if (!partRequestForm.technician_id.trim()) {
    partRequestMessage.value = { type: 'red', text: t('maintenance.messages.technicianRequired') }
    return
  }
  if (!selectedTicket.value.location_id) {
    partRequestMessage.value = { type: 'red', text: t('maintenance.messages.locationRequired') }
    return
  }
  if (partRequestForm.quantity_requested <= 0) {
    partRequestMessage.value = { type: 'red', text: t('maintenance.messages.partQuantityRequired') }
    return
  }
  if (partRequestMode.value === 'external') {
    if (!partRequestForm.external_item_name.trim()) {
      partRequestMessage.value = { type: 'red', text: t('maintenance.messages.externalItemRequired') }
      return
    }
    if (!partRequestForm.external_receipt_number.trim()) {
      partRequestMessage.value = { type: 'red', text: t('maintenance.messages.externalReceiptRequired') }
      return
    }
    if (partRequestForm.external_cost <= 0) {
      partRequestMessage.value = { type: 'red', text: t('maintenance.messages.externalCostRequired') }
      return
    }
  }

  await store.createPartRequest({
    ticket_id: selectedTicket.value.ticket_id,
    customer_device_id: selectedTicket.value.customer_device_id,
    part_id: partRequestMode.value === 'external' ? null : partRequestForm.part_id,
    quantity_requested: partRequestForm.quantity_requested,
    requested_by: partRequestForm.requested_by,
    technician_id: partRequestForm.technician_id,
    status: partRequestForm.status,
    source_preference: partRequestMode.value === 'external' ? 'EXTERNAL_SUPPLIER' : 'STORE_INVENTORY',
    external_item_name:
      partRequestMode.value === 'external' ? partRequestForm.external_item_name.trim() : null,
    external_model:
      partRequestMode.value === 'external' && partRequestForm.external_model.trim()
        ? partRequestForm.external_model.trim()
        : null,
    external_cost: partRequestMode.value === 'external' ? partRequestForm.external_cost : null,
    external_receipt_number:
      partRequestMode.value === 'external' ? partRequestForm.external_receipt_number.trim() : null,
    external_receipt_data_url:
      partRequestMode.value === 'external' && partRequestForm.external_receipt_data_url
        ? partRequestForm.external_receipt_data_url
        : null,
    external_receipt_file_name:
      partRequestMode.value === 'external' && partRequestForm.external_receipt_file_name
        ? partRequestForm.external_receipt_file_name
        : null,
    external_receipt_file_type:
      partRequestMode.value === 'external' && partRequestForm.external_receipt_file_type
        ? partRequestForm.external_receipt_file_type
        : null,
    external_receipt_file_size:
      partRequestMode.value === 'external' && partRequestForm.external_receipt_file_size
        ? partRequestForm.external_receipt_file_size
        : null,
    notes: partRequestForm.notes || null,
    location_id: selectedTicket.value.location_id
  })

  partRequestMessage.value = { type: 'primary', text: t('maintenance.messages.partRequestSaved') }
  resetPartRequestForm()
}

watch(
  selectedTicket,
  (ticket) => {
    if (ticket) {
      partRequestForm.technician_id = ticket.technician_id ?? ''
    }
  },
  { immediate: true }
)

watch(
  () => partRequestForm.part_id,
  () => {
    syncPartQuery()
  }
)

onMounted(async () => {
  await loadPermissions()
  if (!inventoryStore.isLoaded) {
    await inventoryStore.loadAll()
  }
  if (!store.isLoaded) {
    await store.loadAll()
  }
  const prefill = typeof route.query.ticket === 'string' ? route.query.ticket : ''
  if (prefill) {
    selectedTicketId.value = prefill
  }
})
</script>
