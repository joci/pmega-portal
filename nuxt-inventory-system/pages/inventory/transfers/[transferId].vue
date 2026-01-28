<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('inventory.transfers.detailTitle') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('inventory.transfers.detailSubtitle') }}</p>
      </div>
      <NuxtLink
        :to="localePath('/inventory/transfers')"
        class="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
      >
        {{ t('inventory.transfers.backToList') }}
      </NuxtLink>
    </div>

    <div v-if="!canViewInventory" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('permissions.noAccess') }}
    </div>

    <div v-else-if="!transfer" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('inventory.transfers.detailEmpty') }}
    </div>

    <div v-else class="space-y-6">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-4 text-sm text-slate-600">
            <div>
              <div class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.transfers.fields.reference') }}
              </div>
              <div class="mt-1 font-semibold text-slate-900">{{ transfer.transfer_id }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.transfers.fields.item') }}
              </div>
              <div class="mt-1 font-semibold text-slate-900">{{ transfer.item_name }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.transfers.fields.employeeName') }}
              </div>
              <div class="mt-1 text-slate-900">{{ transfer.employee_name || '-' }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.transfers.fields.transferDate') }}
              </div>
              <div class="mt-1 text-slate-900">{{ formatDate(transfer.created_at) }}</div>
            </div>
          </div>
          <div class="space-y-4 text-sm text-slate-600">
            <div>
              <div class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.transfers.fields.fromLocation') }}
              </div>
              <div class="mt-1 text-slate-900">{{ transfer.from_location_name }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.transfers.fields.toLocation') }}
              </div>
              <div class="mt-1 text-slate-900">{{ transfer.to_location_name }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.transfers.fields.quantity') }}
              </div>
              <div class="mt-1 text-slate-900">{{ transfer.quantity }}</div>
            </div>
            <div v-if="canViewCost">
              <div class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.fields.unitCost') }}
              </div>
              <div class="mt-1 text-slate-900">
                {{ transfer.unit_cost !== null ? formatCurrency(transfer.unit_cost) : '-' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <div class="text-xs font-semibold uppercase text-slate-500">
              {{ t('inventory.transfers.fields.notes') }}
            </div>
            <div class="mt-2 text-sm text-slate-700">
              {{ transfer.notes || '-' }}
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold uppercase text-slate-500">
              {{ t('inventory.transfers.fields.attachment') }}
            </div>
            <div class="mt-2 text-sm text-slate-700">
              <a
                v-if="transfer.attachment_data_url && transfer.attachment_file_name"
                class="text-emerald-600 hover:text-emerald-700"
                :href="transfer.attachment_data_url"
                target="_blank"
                rel="noreferrer"
              >
                {{ transfer.attachment_file_name }}
              </a>
              <span v-else>-</span>
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
import { usePermissions } from '~/composables/usePermissions'

type TransferDetail = {
  transfer_id: string
  item_id: string
  item_name: string
  from_location_id: string | null
  to_location_id: string | null
  from_location_name: string
  to_location_name: string
  quantity: number
  unit_cost: number | null
  employee_name: string | null
  notes: string | null
  attachment_data_url: string | null
  attachment_file_name: string | null
  created_at: string | null
}

const store = useInventoryStore()
const route = useRoute()
const { can, loadPermissions } = usePermissions()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const canViewInventory = computed(() => can('inventory.view'))
const canViewCost = computed(() => can('inventory.field.cost.view'))

const transferId = computed(() => {
  const raw = route.params.transferId
  return Array.isArray(raw) ? raw[0] : raw ? String(raw) : ''
})

const transfer = computed<TransferDetail | null>(() => {
  if (!transferId.value) {
    return null
  }
  const movements = store.movements.filter(
    (movement) =>
      movement.movement_type.startsWith('TRANSFER') &&
      (movement.reference_id === transferId.value || movement.movement_id === transferId.value)
  )
  if (movements.length === 0) {
    return null
  }

  const first = movements[0]
  const itemName = store.items.find((entry) => entry.item_id === first.item_id)?.name ?? first.item_id
  const fromMovement = movements.find((entry) => entry.movement_type === 'TRANSFER_OUT') ?? first
  const toMovement = movements.find((entry) => entry.movement_type === 'TRANSFER_IN') ?? first

  const fromLocationName =
    fromMovement.location_id
      ? store.locations.find((entry) => entry.location_id === fromMovement.location_id)?.name ??
        fromMovement.location_id
      : '-'
  const toLocationName =
    toMovement.location_id
      ? store.locations.find((entry) => entry.location_id === toMovement.location_id)?.name ?? toMovement.location_id
      : '-'

  return {
    transfer_id: transferId.value,
    item_id: first.item_id,
    item_name: itemName,
    from_location_id: fromMovement.location_id ?? null,
    to_location_id: toMovement.location_id ?? null,
    from_location_name: fromLocationName,
    to_location_name: toLocationName,
    quantity: first.quantity,
    unit_cost: first.unit_cost ?? null,
    employee_name: first.employee_name ?? null,
    notes: first.notes ?? null,
    attachment_data_url: first.attachment_data_url ?? null,
    attachment_file_name: first.attachment_file_name ?? null,
    created_at: first.created_at ?? null
  }
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
  await loadPermissions()
  if (!store.isLoaded) {
    await store.loadAll()
  }
})
</script>
