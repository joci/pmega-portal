<template>
  <section class="space-y-8">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('inventory.locations.title') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('inventory.locations.subtitle') }}</p>
      </div>
      <NuxtLink
        :to="localePath('/inventory')"
        class="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
      >
        {{ t('inventory.locations.back') }}
      </NuxtLink>
    </div>

    <div class="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('inventory.locations.newTitle') }}</h2>
        <p v-if="!canManageLocations" class="mt-2 text-sm text-slate-500">
          {{ t('permissions.readOnly') }}
        </p>
        <form v-else class="mt-4 grid gap-4" @submit.prevent="handleCreate">
          <div v-if="newLocationError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {{ newLocationError }}
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.locations.fields.name') }}</label>
            <input
              v-model="newLocation.name"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.locations.fields.subCity') }}
              </label>
              <input
                v-model="newLocation.sub_city"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.locations.fields.houseNo') }}
              </label>
              <input
                v-model="newLocation.house_no"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.locations.fields.city') }}
              </label>
              <input
                v-model="newLocation.city"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.locations.fields.country') }}
              </label>
              <input
                v-model="newLocation.country"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('inventory.locations.fields.poBox') }}
            </label>
            <input
              v-model="newLocation.po_box"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.locations.fields.type') }}</label>
            <select
              v-model="newLocation.location_type"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="STORE">{{ t('inventory.options.store') }}</option>
              <option value="WORKSHOP">{{ t('inventory.options.workshop') }}</option>
              <option value="WAREHOUSE">{{ t('inventory.options.warehouse') }}</option>
            </select>
          </div>
          <div class="flex flex-wrap gap-3 pt-2">
            <UButton type="submit" color="primary">
              {{ t('inventory.locations.actions.create') }}
            </UButton>
            <UButton type="button" color="gray" variant="outline" @click="resetNewForm">
              {{ t('inventory.locations.actions.cancel') }}
            </UButton>
          </div>
        </form>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('inventory.locations.listTitle') }}</h2>
        <div v-if="orderedLocations.length === 0" class="mt-4 text-sm text-slate-500">
          {{ t('inventory.locations.empty') }}
        </div>
        <div v-else class="mt-4 space-y-3">
          <div
            v-for="location in orderedLocations"
            :key="location.location_id"
            class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-slate-900">{{ location.name }}</div>
                <div class="text-xs text-slate-500">{{ locationTypeLabel(location.location_type) }}</div>
                <div v-if="formatAddress(location)" class="mt-1 text-xs text-slate-500">
                  {{ formatAddress(location) }}
                </div>
                <div class="mt-2 text-xs text-slate-500">
                  {{ t('inventory.locations.fields.inUse') }}: {{ usageCount(location.location_id) }}
                </div>
                <div v-if="usageCount(location.location_id) > 0" class="mt-1 text-xs text-amber-600">
                  {{ t('inventory.locations.messages.inUse') }}
                </div>
              </div>
              <div v-if="canManageLocations" class="flex gap-2">
                <UButton size="xs" color="gray" variant="outline" @click="startEdit(location)">
                  {{ t('inventory.locations.actions.edit') }}
                </UButton>
                <UButton
                  size="xs"
                  color="red"
                  variant="outline"
                  :disabled="usageCount(location.location_id) > 0"
                  @click="removeLocation(location.location_id)"
                >
                  {{ t('inventory.locations.actions.delete') }}
                </UButton>
              </div>
            </div>

            <div
              v-if="canManageLocations && editingLocationId === location.location_id"
              class="mt-4 border-t border-slate-200 pt-4"
            >
              <div
                v-if="editLocationError"
                class="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                {{ editLocationError }}
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('inventory.locations.fields.name') }}
                  </label>
                  <input
                    v-model="editForm.name"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('inventory.locations.fields.type') }}
                  </label>
                  <select
                    v-model="editForm.location_type"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="STORE">{{ t('inventory.options.store') }}</option>
                    <option value="WORKSHOP">{{ t('inventory.options.workshop') }}</option>
                    <option value="WAREHOUSE">{{ t('inventory.options.warehouse') }}</option>
                  </select>
                </div>
              </div>
              <div class="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('inventory.locations.fields.subCity') }}
                  </label>
                  <input
                    v-model="editForm.sub_city"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('inventory.locations.fields.houseNo') }}
                  </label>
                  <input
                    v-model="editForm.house_no"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('inventory.locations.fields.city') }}
                  </label>
                  <input
                    v-model="editForm.city"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('inventory.locations.fields.country') }}
                  </label>
                  <input
                    v-model="editForm.country"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div class="mt-4">
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.locations.fields.poBox') }}
                </label>
                <input
                  v-model="editForm.po_box"
                  class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div class="mt-4 flex flex-wrap gap-3">
                <UButton size="xs" color="primary" @click="saveEdit(location)">
                  {{ t('inventory.locations.actions.update') }}
                </UButton>
                <UButton size="xs" color="gray" variant="outline" @click="cancelEdit">
                  {{ t('inventory.locations.actions.cancel') }}
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useInventoryStore, type LocationInput } from '~/stores/inventory'
import { useMaintenanceStore } from '~/stores/maintenance'
import { useSalesStore } from '~/stores/sales'
import { useSettingsStore } from '~/stores/settings'
import { usePermissions } from '~/composables/usePermissions'
import type { Location, LocationType } from '~/types/database'

const store = useInventoryStore()
const salesStore = useSalesStore()
const maintenanceStore = useMaintenanceStore()
const settingsStore = useSettingsStore()
const { can, loadPermissions } = usePermissions()
const { t } = useI18n()
const localePath = useLocalePath()
const canManageLocations = computed(() => can('inventory.locations.manage'))

const newLocation = ref<LocationInput>({
  name: '',
  location_type: 'STORE',
  sub_city: '',
  house_no: '',
  city: '',
  country: '',
  po_box: ''
})
const newLocationError = ref('')

const editingLocationId = ref<string | null>(null)
const editForm = ref<LocationInput>({
  name: '',
  location_type: 'STORE',
  sub_city: '',
  house_no: '',
  city: '',
  country: '',
  po_box: ''
})
const editLocationError = ref('')

const orderedLocations = computed(() =>
  [...store.locations].sort((a, b) => a.name.localeCompare(b.name))
)

const locationTypeLabel = (type: LocationType) => {
  if (type === 'WORKSHOP') {
    return t('inventory.options.workshop')
  }
  if (type === 'WAREHOUSE') {
    return t('inventory.options.warehouse')
  }
  return t('inventory.options.store')
}

const formatAddress = (location: Location) => {
  const parts = [
    location.sub_city,
    location.house_no ? `${t('inventory.locations.fields.houseNoShort')} ${location.house_no}` : null,
    location.city,
    location.country,
    location.po_box ? `${t('inventory.locations.fields.poBoxShort')} ${location.po_box}` : null
  ]
  return parts.filter((entry) => entry && String(entry).trim()).join(', ')
}

const usageMap = computed(() => {
  const map = new Map<string, number>()
  const add = (locationId: string) => {
    map.set(locationId, (map.get(locationId) ?? 0) + 1)
  }

  for (const item of store.items) {
    if (item.location_id) {
      add(item.location_id)
    }
  }

  for (const row of store.inventory) {
    add(row.location_id)
  }

  for (const batch of store.batches) {
    add(batch.location_id)
  }

  for (const sale of salesStore.sales) {
    if (sale.location_id) {
      add(sale.location_id)
    }
  }

  for (const ticket of maintenanceStore.tickets) {
    if (ticket.location_id) {
      add(ticket.location_id)
    }
  }

  const appLocation = settingsStore.getSetting('app_location_id')?.setting_value
  if (appLocation) {
    add(appLocation)
  }

  return map
})

const usageCount = (locationId: string) => usageMap.value.get(locationId) ?? 0

const resetNewForm = () => {
  newLocation.value = {
    name: '',
    location_type: 'STORE',
    sub_city: '',
    house_no: '',
    city: '',
    country: '',
    po_box: ''
  }
  newLocationError.value = ''
}

const handleCreate = async () => {
  if (!canManageLocations.value) {
    newLocationError.value = t('permissions.restricted')
    return
  }
  const trimmed = newLocation.value.name.trim()
  if (!trimmed) {
    newLocationError.value = t('inventory.locations.messages.nameRequired')
    return
  }
  await store.createLocation({
    name: trimmed,
    location_type: newLocation.value.location_type,
    sub_city: newLocation.value.sub_city?.trim() || null,
    house_no: newLocation.value.house_no?.trim() || null,
    city: newLocation.value.city?.trim() || null,
    country: newLocation.value.country?.trim() || null,
    po_box: newLocation.value.po_box?.trim() || null
  })
  resetNewForm()
}

const startEdit = (location: Location) => {
  if (!canManageLocations.value) {
    return
  }
  editingLocationId.value = location.location_id
  editForm.value = {
    name: location.name,
    location_type: location.location_type,
    sub_city: location.sub_city ?? '',
    house_no: location.house_no ?? '',
    city: location.city ?? '',
    country: location.country ?? '',
    po_box: location.po_box ?? ''
  }
  editLocationError.value = ''
}

const cancelEdit = () => {
  editingLocationId.value = null
  editLocationError.value = ''
  editForm.value = {
    name: '',
    location_type: 'STORE',
    sub_city: '',
    house_no: '',
    city: '',
    country: '',
    po_box: ''
  }
}

const saveEdit = async (location: Location) => {
  if (!canManageLocations.value) {
    editLocationError.value = t('permissions.restricted')
    return
  }
  const trimmed = editForm.value.name.trim()
  if (!trimmed) {
    editLocationError.value = t('inventory.locations.messages.nameRequired')
    return
  }
  await store.updateLocation({
    ...location,
    name: trimmed,
    location_type: editForm.value.location_type,
    sub_city: editForm.value.sub_city?.trim() || null,
    house_no: editForm.value.house_no?.trim() || null,
    city: editForm.value.city?.trim() || null,
    country: editForm.value.country?.trim() || null,
    po_box: editForm.value.po_box?.trim() || null
  })
  cancelEdit()
}

const removeLocation = async (locationId: string) => {
  if (!canManageLocations.value) {
    return
  }
  if (usageCount(locationId) > 0) {
    return
  }
  await store.deleteLocation(locationId)
  if (editingLocationId.value === locationId) {
    cancelEdit()
  }
}

onMounted(async () => {
  await loadPermissions()
  const tasks: Promise<void>[] = []
  if (!store.isLoaded) {
    tasks.push(store.loadAll())
  }
  if (!salesStore.isLoaded) {
    tasks.push(salesStore.loadAll())
  }
  if (!maintenanceStore.isLoaded) {
    tasks.push(maintenanceStore.loadAll())
  }
  if (!settingsStore.isLoaded) {
    tasks.push(settingsStore.loadAll())
  }
  if (tasks.length) {
    await Promise.all(tasks)
  }
})
</script>
