<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 class="text-lg font-semibold text-slate-900">{{ t('inventory.transfers.formTitle') }}</h2>
    <form class="mt-4 grid gap-4" @submit.prevent="handleSubmit">
      <div v-if="submitError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
        {{ submitError }}
      </div>
      <div v-if="formErrors.length" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
        <div class="text-xs font-semibold uppercase text-red-700">
          {{ t('inventory.validation.errorsTitle') }}
        </div>
        <ul class="mt-2 list-disc space-y-1 pl-4">
          <li v-for="message in formErrors" :key="message">{{ message }}</li>
        </ul>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('inventory.transfers.fields.item') }}
          </label>
          <select
            v-model="transferForm.item_id"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">{{ t('inventory.transfers.fields.item') }}</option>
            <option v-for="item in orderedItems" :key="item.item_id" :value="item.item_id">
              {{ item.name }}
            </option>
          </select>
          <div
            v-if="availabilityByLocation.length"
            class="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
          >
            <div class="text-[11px] font-semibold uppercase text-slate-500">
              {{ t('inventory.transfers.fields.availableByLocation') }}
            </div>
            <div class="mt-2 grid gap-1 sm:grid-cols-2">
              <div v-for="row in availabilityByLocation" :key="row.location_id" class="flex justify-between">
                <span>{{ row.name }}</span>
                <span class="font-semibold text-slate-900">{{ row.available }}</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('inventory.transfers.fields.quantity') }}
          </label>
          <input
            v-model.number="transferForm.quantity"
            type="number"
            min="0"
            step="0.01"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('inventory.transfers.fields.fromLocation') }}
          </label>
          <select
            v-model="transferForm.from_location_id"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">{{ t('inventory.transfers.fields.fromLocation') }}</option>
            <option v-for="location in orderedLocations" :key="location.location_id" :value="location.location_id">
              {{ location.name }}
            </option>
          </select>
          <div v-if="availableAtSource !== null" class="mt-1 text-xs text-slate-500">
            {{ t('inventory.transfers.fields.available') }}: {{ availableAtSource }}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('inventory.transfers.fields.toLocation') }}
          </label>
          <select
            v-model="transferForm.to_location_id"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">{{ t('inventory.transfers.fields.toLocation') }}</option>
            <option v-for="location in orderedLocations" :key="location.location_id" :value="location.location_id">
              {{ location.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('inventory.transfers.fields.transferDate') }}
          </label>
          <input
            v-model="transferForm.transferred_at"
            type="date"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('inventory.transfers.fields.reference') }}
          </label>
          <input
            v-model="transferForm.reference"
            type="text"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('inventory.transfers.fields.notes') }}
          </label>
          <textarea
            v-model="transferForm.notes"
            rows="3"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('inventory.transfers.fields.employeeName') }}
          </label>
          <input
            v-model="transferForm.employee_name"
            type="text"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            :disabled="!isAdmin"
          />
        </div>
      </div>

      <div>
        <label class="text-xs font-semibold uppercase text-slate-500">
          {{ t('inventory.transfers.fields.attachment') }}
        </label>
        <input
          type="file"
          accept="image/*,application/pdf"
          class="mt-1 w-full text-sm"
          @change="handleAttachment"
        />
        <div v-if="transferForm.attachment_file_name" class="mt-2 flex items-center gap-2 text-xs text-slate-600">
          <span>
            {{ t('inventory.transfers.fields.attachmentSelected') }}: {{ transferForm.attachment_file_name }}
          </span>
          <button
            type="button"
            class="text-xs font-semibold text-rose-600 hover:text-rose-700"
            @click="clearAttachment"
          >
            {{ t('inventory.transfers.actions.removeAttachment') }}
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <UButton type="submit" color="primary" size="sm" :disabled="!canEditInventory">
          {{ t('inventory.transfers.actions.submit') }}
        </UButton>
        <UButton type="button" size="sm" color="gray" variant="outline" @click="resetForm">
          {{ t('inventory.transfers.actions.clear') }}
        </UButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { usePermissions } from '~/composables/usePermissions'
import { useFlashMessage } from '~/composables/useFlashMessage'
import { useAuth } from '~/composables/useAuth'

const props = withDefaults(
  defineProps<{
    redirectTo?: string | null
  }>(),
  {
    redirectTo: null
  }
)

const store = useInventoryStore()
const { can, loadPermissions } = usePermissions()
const { setFlashMessage } = useFlashMessage()
const { t } = useI18n()
const localePath = useLocalePath()
const { user } = useAuth()

const canEditInventory = computed(() => can('inventory.edit'))
const isAdmin = computed(() => user.value?.role === 'admin')
const defaultEmployeeName = computed(() => user.value?.name || user.value?.username || user.value?.email || '')

const transferForm = reactive({
  item_id: '',
  from_location_id: '',
  to_location_id: '',
  quantity: 0,
  transferred_at: new Date().toISOString().slice(0, 10),
  reference: '',
  notes: '',
  employee_name: '',
  attachment_data_url: '',
  attachment_file_name: '',
  attachment_file_type: '',
  attachment_file_size: 0
})

watch(
  defaultEmployeeName,
  (value) => {
    if (!transferForm.employee_name) {
      transferForm.employee_name = value
    }
  },
  { immediate: true }
)

const formErrors = ref<string[]>([])
const submitError = ref('')

const orderedItems = computed(() => [...store.items].sort((a, b) => a.name.localeCompare(b.name)))
const orderedLocations = computed(() =>
  [...store.locations].sort((a, b) => a.name.localeCompare(b.name))
)

const availableAtSource = computed(() => {
  if (!transferForm.item_id || !transferForm.from_location_id) {
    return null
  }
  return store.getAvailable(transferForm.item_id, transferForm.from_location_id)
})

const availabilityByLocation = computed(() => {
  if (!transferForm.item_id) {
    return []
  }
  return orderedLocations.value.map((location) => ({
    location_id: location.location_id,
    name: location.name,
    available: store.getAvailable(transferForm.item_id, location.location_id)
  }))
})

const resetForm = () => {
  transferForm.item_id = ''
  transferForm.from_location_id = ''
  transferForm.to_location_id = ''
  transferForm.quantity = 0
  transferForm.transferred_at = new Date().toISOString().slice(0, 10)
  transferForm.reference = ''
  transferForm.notes = ''
  transferForm.employee_name = defaultEmployeeName.value
  transferForm.attachment_data_url = ''
  transferForm.attachment_file_name = ''
  transferForm.attachment_file_type = ''
  transferForm.attachment_file_size = 0
  formErrors.value = []
  submitError.value = ''
}

const handleAttachment = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    clearAttachment()
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    submitError.value = t('inventory.transfers.validation.attachmentTooLarge')
    input.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    transferForm.attachment_data_url = String(reader.result ?? '')
    transferForm.attachment_file_name = file.name
    transferForm.attachment_file_type = file.type
    transferForm.attachment_file_size = file.size
  }
  reader.readAsDataURL(file)
}

const clearAttachment = () => {
  transferForm.attachment_data_url = ''
  transferForm.attachment_file_name = ''
  transferForm.attachment_file_type = ''
  transferForm.attachment_file_size = 0
}

const handleSubmit = async () => {
  formErrors.value = []
  submitError.value = ''

  if (!transferForm.item_id) {
    formErrors.value.push(t('inventory.transfers.validation.itemRequired'))
  }
  if (!transferForm.from_location_id) {
    formErrors.value.push(t('inventory.transfers.validation.fromLocationRequired'))
  }
  if (!transferForm.to_location_id) {
    formErrors.value.push(t('inventory.transfers.validation.toLocationRequired'))
  }
  if (
    transferForm.from_location_id &&
    transferForm.to_location_id &&
    transferForm.from_location_id === transferForm.to_location_id
  ) {
    formErrors.value.push(t('inventory.transfers.validation.locationsDifferent'))
  }
  if (!transferForm.quantity || transferForm.quantity <= 0) {
    formErrors.value.push(t('inventory.transfers.validation.quantityRequired'))
  }
  if (availableAtSource.value !== null && transferForm.quantity > availableAtSource.value) {
    formErrors.value.push(t('inventory.transfers.validation.insufficientStock'))
  }
  if (!transferForm.employee_name.trim()) {
    formErrors.value.push(t('inventory.transfers.validation.employeeRequired'))
  }

  if (formErrors.value.length) {
    return
  }

  try {
    await store.transferStock({
      item_id: transferForm.item_id,
      from_location_id: transferForm.from_location_id,
      to_location_id: transferForm.to_location_id,
      quantity: transferForm.quantity,
      transferred_at: transferForm.transferred_at,
      reference: transferForm.reference?.trim() || null,
      notes: transferForm.notes?.trim() || null,
      employee_name: transferForm.employee_name.trim(),
      attachment_data_url: transferForm.attachment_data_url || null,
      attachment_file_name: transferForm.attachment_file_name || null,
      attachment_file_type: transferForm.attachment_file_type || null,
      attachment_file_size: transferForm.attachment_file_size || null
    })
    setFlashMessage({ text: t('inventory.transfers.messages.success'), type: 'green' })
    if (props.redirectTo) {
      await navigateTo(localePath(props.redirectTo))
    } else {
      resetForm()
    }
  } catch (error: any) {
    const status = error?.data?.statusMessage
    if (status === 'INSUFFICIENT_STOCK') {
      submitError.value = t('inventory.transfers.validation.insufficientStock')
    } else if (status === 'TRANSFER_EMPLOYEE_REQUIRED') {
      submitError.value = t('inventory.transfers.validation.employeeRequired')
    } else if (status === 'TRANSFER_ATTACHMENT_TOO_LARGE') {
      submitError.value = t('inventory.transfers.validation.attachmentTooLarge')
    } else {
      submitError.value = t('inventory.validation.saveFailed')
    }
  }
}

onMounted(async () => {
  await loadPermissions()
  if (!store.isLoaded) {
    await store.loadAll()
  }
})
</script>
