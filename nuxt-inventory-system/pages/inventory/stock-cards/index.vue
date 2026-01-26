<template>
  <section class="space-y-8">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('inventory.stockCards.title') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('inventory.stockCards.subtitle') }}</p>
      </div>
      <NuxtLink
        :to="localePath('/inventory')"
        class="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
      >
        {{ t('inventory.stockCards.back') }}
      </NuxtLink>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="text-xs font-semibold uppercase text-slate-500">
          {{ t('inventory.stockCards.filterLocation') }}
        </div>
        <select
          v-model="locationFilter"
          class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:w-72"
        >
          <option value="">{{ t('inventory.stockCards.allLocations') }}</option>
          <option v-for="location in orderedLocations" :key="location.location_id" :value="location.location_id">
            {{ location.name }}
          </option>
        </select>
      </div>
    </div>

    <div
      v-if="visibleItems.length === 0"
      class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500"
    >
      {{ t('inventory.stockCards.empty') }}
    </div>

    <div v-else class="space-y-6">
      <div
        v-for="item in visibleItems"
        :key="item.item_id"
        class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div class="text-lg font-semibold text-slate-900">{{ item.name }}</div>
            <div v-if="item.description" class="mt-1 text-sm text-slate-500">
              {{ item.description }}
            </div>
            <div class="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
              <div>
                <div class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.stockCards.fields.sellingPrice') }}
                </div>
                <div class="mt-1 font-semibold text-slate-900">{{ formatCurrency(item.price) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.stockCards.fields.cost') }}
                </div>
                <div class="mt-1 font-semibold text-slate-900">{{ formatCurrency(latestCost(item.item_id)) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.stockCards.fields.onHand') }}
                </div>
                <div class="mt-1 font-semibold text-slate-900">
                  {{ store.getOnHand(item.item_id, locationFilter || undefined) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th class="py-2 pr-4">{{ t('inventory.stockCards.fields.date') }}</th>
                <th class="py-2 pr-4">{{ t('inventory.stockCards.fields.type') }}</th>
                <th class="py-2 pr-4">{{ t('inventory.stockCards.fields.store') }}</th>
                <th class="py-2 pr-4">{{ t('inventory.stockCards.fields.receivedQty') }}</th>
                <th class="py-2 pr-4">{{ t('inventory.stockCards.fields.issuedQty') }}</th>
                <th class="py-2 pr-4">{{ t('inventory.stockCards.fields.unitCost') }}</th>
                <th class="py-2 pr-4">{{ t('inventory.stockCards.fields.reference') }}</th>
                <th class="py-2">{{ t('inventory.stockCards.fields.balance') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in stockCard(item.item_id)"
                :key="entry.key"
                class="border-b border-slate-100 text-slate-700"
              >
                <td class="py-2 pr-4">{{ formatDate(entry.date) }}</td>
                <td class="py-2 pr-4">
                  <span
                    class="rounded-full px-2 py-1 text-xs font-semibold"
                    :class="
                      entry.quantity_in > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    "
                  >
                    {{ entry.typeLabel }}
                  </span>
                </td>
                <td class="py-2 pr-4">{{ entry.store }}</td>
                <td class="py-2 pr-4">{{ entry.quantity_in || '-' }}</td>
                <td class="py-2 pr-4">{{ entry.quantity_out || '-' }}</td>
                <td class="py-2 pr-4">{{ entry.unit_cost ? formatCurrency(entry.unit_cost) : '-' }}</td>
                <td class="py-2 pr-4">{{ entry.reference || '-' }}</td>
                <td class="py-2 font-semibold text-slate-900">{{ entry.balance }}</td>
              </tr>
              <tr v-if="stockCard(item.item_id).length === 0">
                <td class="py-3 text-sm text-slate-500" colspan="8">
                  {{ t('inventory.stockCards.noTransactions') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { useSalesStore } from '~/stores/sales'
import type { InventoryBatch, InventoryMovement, Sale, SaleItem } from '~/types/database'

type StockEntry = {
  key: string
  date: string
  type: 'RECEIPT' | 'SALE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT'
  typeLabel: string
  store: string
  quantity_in: number
  quantity_out: number
  unit_cost: number | null
  reference: string | null
  balance: number
}

const store = useInventoryStore()
const salesStore = useSalesStore()
const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const locationFilter = ref('')

const selectedItemId = computed(() => {
  const raw = route.query.item
  return Array.isArray(raw) ? raw[0] : raw ? String(raw) : ''
})

const orderedLocations = computed(() =>
  [...store.locations].sort((a, b) => a.name.localeCompare(b.name))
)

const hasLocationActivity = (itemId: string, locationId: string) => {
  const movementHit = store.movements.some(
    (movement) => movement.item_id === itemId && movement.location_id === locationId
  )
  if (movementHit) {
    return true
  }
  const batchHit = store.batches.some(
    (batch) => batch.item_id === itemId && batch.location_id === locationId
  )
  if (batchHit) {
    return true
  }
  return salesStore.saleItems.some((line) => {
    if (!line.item_id || line.item_id !== itemId || !line.affects_inventory) {
      return false
    }
    const sale = salesById.value.get(line.sale_id)
    return sale?.location_id === locationId
  })
}

const visibleItems = computed(() => {
  if (!selectedItemId.value) {
    if (!locationFilter.value) {
      return store.items
    }
    return store.items.filter((item) => hasLocationActivity(item.item_id, locationFilter.value))
  }
  const matches = store.items.filter((item) => item.item_id === selectedItemId.value)
  if (!locationFilter.value) {
    return matches
  }
  return matches.filter((item) => hasLocationActivity(item.item_id, locationFilter.value))
})

const salesById = computed(() => {
  const map = new Map<string, Sale>()
  for (const sale of salesStore.sales) {
    map.set(sale.sale_id, sale)
  }
  return map
})

const locationById = computed(() => {
  const map = new Map<string, string>()
  for (const location of store.locations) {
    map.set(location.location_id, location.name)
  }
  return map
})

const latestCost = (itemId: string) => {
  const movementCost = store.movements
    .filter(
      (movement) =>
        movement.item_id === itemId &&
        (!locationFilter.value || movement.location_id === locationFilter.value) &&
        movement.unit_cost !== null &&
        movement.unit_cost !== undefined
    )
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  if (movementCost[0]?.unit_cost !== null && movementCost[0]?.unit_cost !== undefined) {
    return movementCost[0].unit_cost
  }
  const batches = store.batches
    .filter(
      (batch) =>
        batch.item_id === itemId && (!locationFilter.value || batch.location_id === locationFilter.value)
    )
    .sort((a, b) => b.received_at.localeCompare(a.received_at))
  if (batches[0]) {
    return batches[0].unit_cost
  }
  const item = store.items.find((entry) => entry.item_id === itemId)
  return item?.cost ?? 0
}

const stockCard = (itemId: string) => {
  const movementData = buildMovementEntries(itemId)
  const legacyEntries = buildLegacyEntries(itemId, movementData)
  const entries = [...movementData.entries, ...legacyEntries]

  const ordered = entries.sort((a, b) => a.date.localeCompare(b.date))
  let balance = 0
  return ordered.map((entry) => {
    balance += entry.quantity_in
    balance -= entry.quantity_out
    return {
      ...entry,
      balance
    }
  })
}

const buildMovementEntries = (itemId: string) => {
  const entries: Array<Omit<StockEntry, 'balance'>> = []
  const receiptRefs = new Set<string>()
  const saleRefs = new Set<string>()
  const movements = store.movements.filter(
    (movement) =>
      movement.item_id === itemId && (!locationFilter.value || movement.location_id === locationFilter.value)
  )

  for (const movement of movements) {
    const typeLabel = movementTypeLabel(movement)
    const isInbound = isInboundMovement(movement.movement_type)
    const reference = movementReference(movement)
    const refKey = movement.reference_id ?? ''
    if (movement.movement_type === 'RECEIPT') {
      receiptRefs.add(`${movement.item_id}|${movement.location_id}|${refKey}`)
    }
    if (movement.movement_type === 'SALE') {
      saleRefs.add(`${movement.item_id}|${refKey}`)
    }

    entries.push({
      key: `movement-${movement.movement_id}`,
      date: movement.created_at ?? '',
      type: movement.movement_type,
      typeLabel,
      store: locationById.value.get(movement.location_id) ?? movement.location_id,
      quantity_in: isInbound ? movement.quantity : 0,
      quantity_out: isInbound ? 0 : movement.quantity,
      unit_cost: movement.unit_cost ?? null,
      reference
    })
  }

  return { entries, receiptRefs, saleRefs }
}

const buildLegacyEntries = (
  itemId: string,
  movementData: { receiptRefs: Set<string>; saleRefs: Set<string> }
) => {
  const entries: Array<Omit<StockEntry, 'balance'>> = []
  const batches = store.batches.filter(
    (batch) =>
      batch.item_id === itemId && (!locationFilter.value || batch.location_id === locationFilter.value)
  )
  const sales = salesStore.saleItems.filter((line) => {
    if (line.item_id !== itemId || !line.affects_inventory) {
      return false
    }
    if (!locationFilter.value) {
      return true
    }
    const sale = salesById.value.get(line.sale_id)
    return sale?.location_id === locationFilter.value
  })

  for (const batch of batches) {
    if (isTransferBatch(batch)) {
      continue
    }
    const baseKey = `${batch.item_id}|${batch.location_id}|`
    const hasReceiptMovement =
      movementData.receiptRefs.has(`${baseKey}${batch.batch_id}`) ||
      (batch.reference && movementData.receiptRefs.has(`${baseKey}${batch.reference}`))
    if (hasReceiptMovement) {
      continue
    }
    entries.push({
      key: `receipt-${batch.batch_id}`,
      date: batch.received_at,
      type: 'RECEIPT',
      typeLabel: t('inventory.stockCards.types.receipt'),
      store: locationById.value.get(batch.location_id) ?? batch.location_id,
      quantity_in: batch.quantity_received,
      quantity_out: 0,
      unit_cost: batch.unit_cost,
      reference: batch.reference ?? null
    })
  }

  for (const line of sales) {
    const sale = salesById.value.get(line.sale_id)
    if (movementData.saleRefs.has(`${itemId}|${line.sale_id}`)) {
      continue
    }
    entries.push({
      key: `issue-${line.sale_item_id}`,
      date: sale?.sale_date ?? line.created_at ?? '',
      type: 'SALE',
      typeLabel: t('inventory.stockCards.types.sale'),
      store: sale?.location_id ? locationById.value.get(sale.location_id) ?? sale.location_id : '-',
      quantity_in: 0,
      quantity_out: line.quantity,
      unit_cost: null,
      reference: sale?.sale_number ?? sale?.sale_id ?? null
    })
  }

  return entries
}

const isTransferBatch = (batch: InventoryBatch) => {
  const reference = (batch.reference ?? '').trim().toLowerCase()
  return reference.startsWith('transfer ')
}

const isInboundMovement = (type: InventoryMovement['movement_type']) => {
  return type === 'RECEIPT' || type === 'TRANSFER_IN' || type === 'ADJUSTMENT'
}

const movementTypeLabel = (movement: InventoryMovement) => {
  switch (movement.movement_type) {
    case 'TRANSFER_IN':
      return t('inventory.stockCards.types.transferIn')
    case 'TRANSFER_OUT':
      return t('inventory.stockCards.types.transferOut')
    case 'SALE':
      return t('inventory.stockCards.types.sale')
    case 'ADJUSTMENT':
      return t('inventory.stockCards.types.adjustment')
    default:
      return t('inventory.stockCards.types.receipt')
  }
}

const movementReference = (movement: InventoryMovement) => {
  if (movement.movement_type === 'SALE' && movement.reference_id) {
    const sale = salesById.value.get(movement.reference_id)
    return sale?.sale_number ?? movement.reference_id
  }
  return movement.reference_id ?? null
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'ETB' }).format(value)
}

const formatDate = (value: string) => {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleDateString(locale.value)
}

onMounted(async () => {
  if (!store.isLoaded) {
    await store.loadAll()
  }
  if (!salesStore.isLoaded) {
    await salesStore.loadAll()
  }
})
</script>
