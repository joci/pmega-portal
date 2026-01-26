<template>
  <section class="space-y-8">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('inventory.title') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('inventory.subtitle') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3 text-sm font-semibold">
        <NuxtLink v-if="canEditInventory" :to="localePath('/inventory/new')">
          <UButton color="primary" size="sm">{{ t('inventory.actions.add') }}</UButton>
        </NuxtLink>
        <NuxtLink :to="localePath('/inventory/categories')" class="text-emerald-600 hover:text-emerald-700">
          {{ t('inventory.manageCategories') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/inventory/cost-sheet')" class="text-emerald-600 hover:text-emerald-700">
          {{ t('inventory.manageCostSheet') }}
        </NuxtLink>
        <NuxtLink
          v-if="canManageLocations"
          :to="localePath('/inventory/locations')"
          class="text-emerald-600 hover:text-emerald-700"
        >
          {{ t('inventory.manageLocations') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/inventory/stock-cards')" class="text-emerald-600 hover:text-emerald-700">
          {{ t('inventory.manageStockCards') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/inventory/transfers')" class="text-emerald-600 hover:text-emerald-700">
          {{ t('inventory.manageTransfers') }}
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
        <h2 class="text-lg font-semibold text-slate-900">{{ t('inventory.listTitle') }}</h2>
          <div class="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              v-model="searchQuery"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:w-64"
              :placeholder="t('inventory.list.searchPlaceholder')"
            />
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.list.locationLabel') }}</span>
              <select
                v-model="locationFilter"
                class="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">{{ t('inventory.list.allLocations') }}</option>
                <option v-for="location in orderedLocations" :key="location.location_id" :value="location.location_id">
                  {{ location.name }}
                </option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.list.pageSize') }}</span>
              <select v-model.number="pageSize" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
              </select>
          </div>
        </div>
      </div>

      <div v-if="store.items.length === 0" class="mt-6 text-sm text-slate-500">
        {{ t('inventory.empty') }}
      </div>
      <div v-else class="mt-6 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="text-left text-xs font-semibold uppercase text-slate-500">
            <tr class="border-b border-slate-200">
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('name')">
                  {{ t('inventory.fields.name') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('name') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('type')">
                  {{ t('inventory.fields.type') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('type') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('category')">
                  {{ t('inventory.fields.category') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('category') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4 text-right">
                <button type="button" class="ml-auto flex items-center gap-1" @click="toggleSort('onHand')">
                  {{ t('inventory.totalStock') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('onHand') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4 text-right">
                <button type="button" class="ml-auto flex items-center gap-1" @click="toggleSort('reserved')">
                  {{ t('inventory.list.reserved') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('reserved') }}</span>
                </button>
              </th>
              <th class="py-2 pr-4 text-right">
                <button type="button" class="ml-auto flex items-center gap-1" @click="toggleSort('available')">
                  {{ t('inventory.list.available') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('available') }}</span>
                </button>
              </th>
              <th v-if="canViewPrice" class="py-2 pr-4 text-right">
                <button type="button" class="ml-auto flex items-center gap-1" @click="toggleSort('price')">
                  {{ t('inventory.fields.price') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('price') }}</span>
                </button>
              </th>
              <th v-if="canViewCost" class="py-2 pr-4 text-right">
                <button type="button" class="ml-auto flex items-center gap-1" @click="toggleSort('cost')">
                  {{ t('inventory.fields.cost') }}
                  <span class="text-[10px] text-slate-400">{{ sortIndicator('cost') }}</span>
                </button>
              </th>
              <th class="py-2 text-right">{{ t('inventory.list.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pagedItems.length === 0">
              <td :colspan="columnCount" class="py-6 text-center text-sm text-slate-500">
                {{ t('inventory.list.noResults') }}
              </td>
            </tr>
            <tr v-for="item in pagedItems" :key="item.item_id" class="border-b border-slate-100">
              <td class="py-3 pr-4">
                <div class="font-semibold text-slate-900">{{ item.name }}</div>
                <div v-if="item.model" class="text-xs text-slate-500">
                  {{ t('inventory.fields.model') }}: {{ item.model }}
                </div>
                <div v-if="item.serial_number" class="text-xs text-slate-500">
                  {{ t('inventory.fields.serialNumber') }}: {{ item.serial_number }}
                </div>
                <div v-if="item.sku" class="text-xs text-slate-500">{{ item.sku }}</div>
              </td>
              <td class="py-3 pr-4 text-sm text-slate-700">{{ item.item_type }}</td>
              <td class="py-3 pr-4 text-sm text-slate-700">{{ categoryName(item.category_id) }}</td>
              <td class="py-3 pr-4 text-right text-sm text-slate-700">
                {{ totalQuantity(item.item_id) }}
              </td>
              <td class="py-3 pr-4 text-right text-sm text-slate-700">
                {{ reservedQuantity(item.item_id) }}
              </td>
              <td class="py-3 pr-4 text-right text-sm text-slate-700">
                {{ availableQuantity(item.item_id) }}
              </td>
              <td v-if="canViewPrice" class="py-3 pr-4 text-right text-sm text-slate-700">
                {{ formatCurrency(item.price) }}
              </td>
              <td v-if="canViewCost" class="py-3 pr-4 text-right text-sm text-slate-700">
                {{ formatCurrency(item.cost) }}
              </td>
              <td class="py-3 text-right">
                <div class="flex flex-wrap justify-end gap-2">
                  <NuxtLink
                    :to="localePath({ path: '/inventory/stock-cards', query: { item: item.item_id } })"
                  >
                    <UButton size="xs" color="gray" variant="soft">
                      {{ t('inventory.actions.stockCard') }}
                    </UButton>
                  </NuxtLink>
                  <NuxtLink v-if="canEditInventory" :to="localePath(`/inventory/${item.item_id}`)">
                    <UButton size="xs" color="gray" variant="outline">{{ t('inventory.actions.edit') }}</UButton>
                  </NuxtLink>
                  <UButton
                    v-if="canDeleteItem(item)"
                    size="xs"
                    color="red"
                    variant="outline"
                    @click="removeItem(item.item_id)"
                  >
                    {{ t('inventory.actions.delete') }}
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="mt-4 flex flex-col gap-3 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            {{ t('inventory.list.showing', { start: pageStart, end: pageEnd, total: filteredItems.length }) }}
          </div>
          <div class="flex items-center gap-2">
            <UButton size="xs" color="gray" variant="outline" :disabled="currentPage === 1" @click="prevPage">
              {{ t('inventory.list.prev') }}
            </UButton>
            <div class="text-xs font-semibold text-slate-600">
              {{ currentPage }} / {{ pageCount }}
            </div>
            <UButton
              size="xs"
              color="gray"
              variant="outline"
              :disabled="currentPage === pageCount"
              @click="nextPage"
            >
              {{ t('inventory.list.next') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import type { Item } from '~/types/database'
import { usePermissions } from '~/composables/usePermissions'
import { useFlashMessage, type FlashMessage } from '~/composables/useFlashMessage'

type SortKey = 'name' | 'type' | 'category' | 'onHand' | 'reserved' | 'available' | 'price' | 'cost'

const store = useInventoryStore()
const { can, loadPermissions } = usePermissions()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const canViewInventory = computed(() => can('inventory.view'))
const canEditInventory = computed(() => can('inventory.edit'))
const canViewPrice = computed(() => can('inventory.field.price.view'))
const canViewCost = computed(() => can('inventory.field.cost.view'))
const canManageLocations = computed(() => can('inventory.locations.manage'))
const canRemoveCostSheetItems = computed(() => can('inventory.cost_sheet.remove'))

const { consumeFlashMessage } = useFlashMessage()
const pageMessage = ref<FlashMessage | null>(null)

const columnCount = computed(() => 7 + (canViewPrice.value ? 1 : 0) + (canViewCost.value ? 1 : 0))

const searchQuery = ref('')
const locationFilter = ref('')
const pageSizes = [10, 20, 50]
const pageSize = ref(pageSizes[0])
const currentPage = ref(1)
const sortKey = ref<SortKey>('name')
const sortDirection = ref<'asc' | 'desc'>('asc')

const categoryName = (categoryId?: string | null) => {
  if (!categoryId) {
    return t('inventory.options.uncategorized')
  }
  return (
    store.categories.find((category) => category.category_id === categoryId)?.name ??
    t('inventory.options.uncategorized')
  )
}

const totalQuantity = (itemId: string) => {
  return store.getOnHand(itemId, locationFilter.value || undefined)
}

const reservedQuantity = (itemId: string) => {
  return store.getReserved(itemId, locationFilter.value || undefined)
}

const availableQuantity = (itemId: string) => {
  return store.getAvailable(itemId, locationFilter.value || undefined)
}

const canDeleteItem = (item: Item) => {
  if (!canEditInventory.value) {
    return false
  }
  if (item.cost_sheet_entry_id && !canRemoveCostSheetItems.value) {
    return false
  }
  return true
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'ETB' }).format(value || 0)
}

const orderedLocations = computed(() =>
  [...store.locations].sort((a, b) => a.name.localeCompare(b.name))
)

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return store.items.filter((item) => {
    if (locationFilter.value) {
      const onHand = store.getOnHand(item.item_id, locationFilter.value)
      const reserved = store.getReserved(item.item_id, locationFilter.value)
      if (onHand === 0 && reserved === 0) {
        return false
      }
    }
    if (!query) {
      return true
    }
    const fields = [
      item.name,
      item.model ?? '',
      item.serial_number ?? '',
      item.sku ?? '',
      item.item_type,
      categoryName(item.category_id)
    ]
    return fields.some((field) => field.toLowerCase().includes(query))
  })
})

const sortedItems = computed(() => {
  const items = [...filteredItems.value]
  const direction = sortDirection.value === 'asc' ? 1 : -1

  return items.sort((a: Item, b: Item) => {
    let left: string | number = ''
    let right: string | number = ''

    switch (sortKey.value) {
      case 'type':
        left = a.item_type
        right = b.item_type
        break
      case 'category':
        left = categoryName(a.category_id)
        right = categoryName(b.category_id)
        break
      case 'onHand':
        left = totalQuantity(a.item_id)
        right = totalQuantity(b.item_id)
        break
      case 'reserved':
        left = reservedQuantity(a.item_id)
        right = reservedQuantity(b.item_id)
        break
      case 'available':
        left = availableQuantity(a.item_id)
        right = availableQuantity(b.item_id)
        break
      case 'price':
        left = a.price
        right = b.price
        break
      case 'cost':
        left = a.cost
        right = b.cost
        break
      case 'name':
      default:
        left = a.name
        right = b.name
        break
    }

    if (typeof left === 'number' && typeof right === 'number') {
      return (left - right) * direction
    }

    return String(left).localeCompare(String(right)) * direction
  })
})

const pageCount = computed(() => {
  return Math.max(1, Math.ceil(sortedItems.value.length / pageSize.value))
})

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedItems.value.slice(start, start + pageSize.value)
})

const pageStart = computed(() => {
  if (sortedItems.value.length === 0) {
    return 0
  }
  return (currentPage.value - 1) * pageSize.value + 1
})

const pageEnd = computed(() => {
  return Math.min(currentPage.value * pageSize.value, sortedItems.value.length)
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

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1
  }
}

const nextPage = () => {
  if (currentPage.value < pageCount.value) {
    currentPage.value += 1
  }
}

const removeItem = async (itemId: string) => {
  await store.deleteItem(itemId)
}

watch([searchQuery, pageSize, sortKey, sortDirection, locationFilter], () => {
  currentPage.value = 1
})

watch(pageCount, (next) => {
  if (currentPage.value > next) {
    currentPage.value = next
  }
})

onMounted(async () => {
  await loadPermissions()
  pageMessage.value = consumeFlashMessage()
  if (!store.isLoaded) {
    await store.loadAll()
  }
})
</script>
