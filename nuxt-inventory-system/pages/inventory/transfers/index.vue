<template>
  <section class="space-y-8">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('inventory.transfers.title') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('inventory.transfers.subtitle') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3 text-sm font-semibold">
        <NuxtLink
          :to="localePath('/inventory')"
          class="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          {{ t('inventory.transfers.back') }}
        </NuxtLink>
        <NuxtLink v-if="canEditInventory" :to="localePath('/inventory/transfers/new')">
          <UButton color="primary" size="sm">{{ t('inventory.transfers.actions.new') }}</UButton>
        </NuxtLink>
      </div>
    </div>

    <div v-if="pageMessage" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
      <UAlert :color="pageMessage.type ?? 'primary'" :title="pageMessage.text" />
    </div>

    <div v-if="!canViewInventory" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('permissions.noAccess') }}
    </div>

    <div v-else class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('inventory.transfers.listTitle') }}</h2>
        <input
          v-model="searchQuery"
          class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:w-64"
          :placeholder="t('inventory.transfers.list.searchPlaceholder')"
        />
      </div>

      <div v-if="transfers.length === 0" class="mt-6 text-sm text-slate-500">
        {{ searchQuery ? t('inventory.transfers.list.noResults') : t('inventory.transfers.list.empty') }}
      </div>
      <div v-else class="mt-6 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="text-left text-xs font-semibold uppercase text-slate-500">
            <tr class="border-b border-slate-200">
              <th class="py-2 pr-4">{{ t('inventory.transfers.fields.transferDate') }}</th>
              <th class="py-2 pr-4">{{ t('inventory.transfers.fields.item') }}</th>
              <th class="py-2 pr-4">{{ t('inventory.transfers.fields.fromLocation') }}</th>
              <th class="py-2 pr-4">{{ t('inventory.transfers.fields.toLocation') }}</th>
              <th class="py-2 pr-4">{{ t('inventory.transfers.fields.employeeName') }}</th>
              <th class="py-2 pr-4 text-right">{{ t('inventory.transfers.fields.quantity') }}</th>
              <th v-if="canViewCost" class="py-2 pr-4 text-right">{{ t('inventory.fields.unitCost') }}</th>
              <th class="py-2">{{ t('inventory.stockCards.fields.reference') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transfer in transfers" :key="transfer.transfer_id" class="border-b border-slate-100">
              <td class="py-3 pr-4 text-sm text-slate-700">{{ formatDate(transfer.created_at) }}</td>
              <td class="py-3 pr-4 text-sm text-slate-700">
                {{ itemName(transfer.item_id) }}
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">
                {{ locationName(transfer.from_location_id) }}
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">
                {{ locationName(transfer.to_location_id) }}
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">
                {{ transfer.employee_name || '-' }}
              </td>
              <td class="py-3 pr-4 text-right text-sm text-slate-700">{{ transfer.quantity }}</td>
              <td v-if="canViewCost" class="py-3 pr-4 text-right text-sm text-slate-700">
                {{ transfer.unit_cost !== null ? formatCurrency(transfer.unit_cost) : '-' }}
              </td>
              <td class="py-3 text-sm text-slate-700">
                <NuxtLink
                  :to="localePath(`/inventory/transfers/${transfer.transfer_id}`)"
                  class="text-emerald-600 hover:text-emerald-700"
                >
                  {{ transfer.transfer_id }}
                </NuxtLink>
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
import { useFlashMessage, type FlashMessage } from '~/composables/useFlashMessage'

type TransferRow = {
  transfer_id: string
  item_id: string
  quantity: number
  from_location_id?: string | null
  to_location_id?: string | null
  created_at?: string | null
  unit_cost?: number | null
  employee_name?: string | null
  notes?: string | null
  attachment_data_url?: string | null
  attachment_file_name?: string | null
}

const store = useInventoryStore()
const { can, loadPermissions } = usePermissions()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const canViewInventory = computed(() => can('inventory.view'))
const canEditInventory = computed(() => can('inventory.edit'))
const canViewCost = computed(() => can('inventory.field.cost.view'))

const searchQuery = ref('')

const { consumeFlashMessage } = useFlashMessage()
const pageMessage = ref<FlashMessage | null>(null)

const locationName = (locationId?: string | null) => {
  if (!locationId) {
    return '-'
  }
  return store.locations.find((entry) => entry.location_id === locationId)?.name ?? locationId
}

const itemName = (itemId: string) => {
  return store.items.find((entry) => entry.item_id === itemId)?.name ?? itemId
}

const transfers = computed(() => {
  const map = new Map<string, TransferRow>()
  for (const movement of store.movements) {
    if (movement.movement_type !== 'TRANSFER_OUT' && movement.movement_type !== 'TRANSFER_IN') {
      continue
    }
    const transferId = movement.reference_id ?? movement.movement_id
    const current =
      map.get(transferId) ?? {
        transfer_id: transferId,
        item_id: movement.item_id,
        quantity: movement.quantity,
        created_at: movement.created_at ?? null,
        unit_cost: movement.unit_cost ?? null,
        from_location_id: null,
        to_location_id: null,
        employee_name: movement.employee_name ?? null,
        notes: movement.notes ?? null,
        attachment_data_url: movement.attachment_data_url ?? null,
        attachment_file_name: movement.attachment_file_name ?? null
      }
    if (movement.movement_type === 'TRANSFER_OUT') {
      current.from_location_id = movement.location_id
    }
    if (movement.movement_type === 'TRANSFER_IN') {
      current.to_location_id = movement.location_id
    }
    if (!current.created_at || (movement.created_at && movement.created_at > current.created_at)) {
      current.created_at = movement.created_at ?? current.created_at
    }
    if (!current.employee_name && movement.employee_name) {
      current.employee_name = movement.employee_name
    }
    if (!current.notes && movement.notes) {
      current.notes = movement.notes
    }
    if (!current.attachment_data_url && movement.attachment_data_url) {
      current.attachment_data_url = movement.attachment_data_url
      current.attachment_file_name = movement.attachment_file_name ?? null
    }
    map.set(transferId, current)
  }

  const list = Array.from(map.values())
  const query = searchQuery.value.trim().toLowerCase()
  const filtered = query
    ? list.filter((entry) => {
        const name = itemName(entry.item_id).toLowerCase()
        return (
          entry.transfer_id.toLowerCase().includes(query) ||
          name.includes(query) ||
          (entry.notes && entry.notes.toLowerCase().includes(query)) ||
          (entry.employee_name && entry.employee_name.toLowerCase().includes(query)) ||
          (entry.from_location_id && locationName(entry.from_location_id).toLowerCase().includes(query)) ||
          (entry.to_location_id && locationName(entry.to_location_id).toLowerCase().includes(query))
        )
      })
    : list

  return filtered.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'ETB' }).format(value)
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleDateString(locale.value)
}

onMounted(async () => {
  pageMessage.value = consumeFlashMessage()
  await loadPermissions()
  if (!store.isLoaded) {
    await store.loadAll()
  }
})
</script>
