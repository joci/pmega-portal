<template>
  <section class="space-y-8">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('inventory.title') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('inventory.subtitle') }}</p>
      </div>
      <NuxtLink
        :to="localePath('/inventory/categories')"
        class="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
      >
        {{ t('inventory.manageCategories') }}
      </NuxtLink>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">
          {{ editingItem ? t('inventory.formTitleEdit') : t('inventory.formTitleAdd') }}
        </h2>
        <form class="mt-4 grid gap-4" @submit.prevent="handleSubmit">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.name') }}</label>
              <input
                v-model="form.name"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.sku') }}</label>
              <input
                v-model="form.sku"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.description') }}</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.type') }}</label>
              <select
                v-model="form.item_type"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="PRODUCT">{{ t('inventory.options.product') }}</option>
                <option value="SPARE_PART">{{ t('inventory.options.sparePart') }}</option>
              </select>
            </div>
            <div>
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.category') }}</label>
                <button
                  type="button"
                  class="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  @click="toggleCategoryForm"
                >
                  {{ t('inventory.actions.addCategory') }}
                </button>
              </div>
              <select
                v-model="form.category_id"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">{{ t('inventory.options.uncategorized') }}</option>
                <option v-for="category in store.categories" :key="category.category_id" :value="category.category_id">
                  {{ category.name }}
                </option>
              </select>
              <div v-if="isCategoryFormOpen" class="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.categoryForm.title') }}
                </div>
                <div class="grid gap-3 md:grid-cols-2">
                  <div>
                    <label class="text-xs font-semibold uppercase text-slate-500">
                      {{ t('inventory.categoryForm.name') }}
                    </label>
                    <input
                      v-model="categoryForm.name"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-semibold uppercase text-slate-500">
                      {{ t('inventory.categoryForm.type') }}
                    </label>
                    <select
                      v-model="categoryForm.category_type"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="PRODUCT">{{ t('inventory.options.product') }}</option>
                      <option value="SPARE_PART">{{ t('inventory.options.sparePart') }}</option>
                      <option value="BOTH">{{ t('inventory.options.both') }}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('inventory.categoryForm.description') }}
                  </label>
                  <input
                    v-model="categoryForm.description"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div v-if="categoryFormError" class="text-xs text-red-600">
                  {{ categoryFormError }}
                </div>
                <div class="flex flex-wrap gap-2">
                  <UButton size="xs" color="primary" type="button" @click="saveCategory">
                    {{ t('inventory.categoryForm.save') }}
                  </UButton>
                  <UButton size="xs" color="gray" variant="outline" type="button" @click="cancelCategoryForm">
                    {{ t('inventory.categoryForm.cancel') }}
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.price') }}</label>
              <input
                v-model.number="form.price"
                type="number"
                step="0.01"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.cost') }}</label>
              <input
                v-model.number="form.cost"
                type="number"
                step="0.01"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.stockLocation') }}</label>
              <select
                v-model="form.stock_location"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="STORE">{{ t('inventory.options.store') }}</option>
                <option value="WORKSHOP">{{ t('inventory.options.workshop') }}</option>
                <option value="BOTH">{{ t('inventory.options.both') }}</option>
              </select>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{
                t('inventory.fields.manufacturer')
              }}</label>
              <input
                v-model="form.manufacturer"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.barcode') }}</label>
              <input
                v-model="form.barcode"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.weight') }}</label>
              <input
                v-model.number="form.weight"
                type="number"
                step="0.01"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.dimensions') }}</label>
              <input
                v-model="form.dimensions"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{
                t('inventory.fields.warrantyPeriod')
              }}</label>
              <input
                v-model.number="form.warranty_period"
                type="number"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.minStock') }}</label>
              <input
                v-model.number="form.min_stock_level"
                type="number"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.reorderQty') }}</label>
              <input
                v-model.number="form.reorder_quantity"
                type="number"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div class="flex items-end gap-2">
              <input id="maintenance-flag" v-model="form.is_for_maintenance" type="checkbox" />
              <label class="text-xs font-semibold uppercase text-slate-500" for="maintenance-flag">
                {{ t('inventory.fields.forMaintenance') }}
              </label>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.initialLocation') }}</label>
              <select
                v-model="form.inventory_location_id"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">{{ t('inventory.options.selectLocation') }}</option>
                <option v-for="location in store.locations" :key="location.location_id" :value="location.location_id">
                  {{ location.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.quantity') }}</label>
              <input
                v-model.number="form.initial_quantity"
                type="number"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="space-y-3 rounded-xl border border-dashed border-slate-200 bg-white p-4">
            <div>
              <div class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.attachments') }}</div>
              <p class="mt-1 text-xs text-slate-500">{{ t('inventory.attachments.helper') }}</p>
            </div>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              class="text-xs text-slate-600"
              @change="handleAttachmentSelect"
            />
            <div v-if="attachmentErrors.length" class="space-y-1 text-xs text-red-600">
              <div v-for="message in attachmentErrors" :key="message">{{ message }}</div>
            </div>
            <div v-if="existingAttachments.length" class="space-y-2">
              <div class="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                <span>{{ t('inventory.attachments.savedTitle') }}</span>
                <span v-if="existingAttachments.length > 1" class="font-normal text-slate-400">
                  {{ t('inventory.attachments.reorderHint') }}
                </span>
              </div>
              <div
                v-for="attachment in existingAttachments"
                :key="attachment.attachment_id"
                class="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs transition"
                :class="
                  dragOverAttachmentId === attachment.attachment_id
                    ? 'border-emerald-300 bg-emerald-50'
                    : ''
                "
                draggable="true"
                @dragstart="handleAttachmentDragStart(attachment.attachment_id)"
                @dragend="handleAttachmentDragEnd"
                @dragover.prevent="handleAttachmentDragOver(attachment.attachment_id)"
                @drop="handleAttachmentDrop(attachment.attachment_id)"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <div
                    class="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-[10px] font-semibold uppercase text-slate-500"
                  >
                    <img
                      v-if="isImageAttachment(attachment.file_type)"
                      :src="attachment.data_url"
                      :alt="attachment.file_name"
                      class="h-full w-full object-cover"
                    />
                    <span v-else>PDF</span>
                  </div>
                  <div class="min-w-0">
                    <a
                      class="block truncate text-slate-700 hover:text-slate-900"
                      :href="attachment.data_url"
                      target="_blank"
                      rel="noopener"
                    >
                      {{ attachment.file_name }}
                    </a>
                    <div class="text-[11px] text-slate-500">{{ formatFileSize(attachment.file_size) }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2 text-slate-500">
                  <span class="cursor-move text-[10px] uppercase">{{ t('inventory.attachments.drag') }}</span>
                  <button
                    type="button"
                    class="text-red-600 hover:text-red-700"
                    @click="removeAttachment(attachment.attachment_id)"
                  >
                    {{ t('inventory.actions.delete') }}
                  </button>
                </div>
              </div>
            </div>
            <div v-if="pendingAttachments.length" class="space-y-2">
              <div class="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                <span>{{ t('inventory.attachments.pendingTitle') }}</span>
                <span v-if="pendingAttachments.length > 1" class="font-normal text-slate-400">
                  {{ t('inventory.attachments.reorderHint') }}
                </span>
              </div>
              <div
                v-for="attachment in pendingAttachments"
                :key="attachment.temp_id"
                class="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs transition"
                :class="dragOverPendingId === attachment.temp_id ? 'border-emerald-300 bg-emerald-100' : ''"
                draggable="true"
                @dragstart="handlePendingDragStart(attachment.temp_id)"
                @dragend="handlePendingDragEnd"
                @dragover.prevent="handlePendingDragOver(attachment.temp_id)"
                @drop="handlePendingDrop(attachment.temp_id)"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <div
                    class="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-lg border border-emerald-200 bg-white text-[10px] font-semibold uppercase text-emerald-600"
                  >
                    <img
                      v-if="isImageAttachment(attachment.file_type)"
                      :src="attachment.data_url"
                      :alt="attachment.file_name"
                      class="h-full w-full object-cover"
                    />
                    <span v-else>PDF</span>
                  </div>
                  <div class="min-w-0">
                    <span class="block truncate text-slate-700">{{ attachment.file_name }}</span>
                    <div class="text-[11px] text-slate-500">{{ formatFileSize(attachment.file_size) }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2 text-slate-500">
                  <span class="cursor-move text-[10px] uppercase">{{ t('inventory.attachments.drag') }}</span>
                  <button
                    type="button"
                    class="text-slate-600 hover:text-slate-800"
                    @click="removePendingAttachment(attachment.temp_id)"
                  >
                    {{ t('inventory.actions.clear') }}
                  </button>
                </div>
              </div>
            </div>
            <div
              v-if="!existingAttachments.length && !pendingAttachments.length"
              class="text-xs text-slate-500"
            >
              {{ t('inventory.attachments.empty') }}
            </div>
          </div>

          <div v-if="formErrors.length" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <div class="text-xs font-semibold uppercase text-red-700">
              {{ t('inventory.validation.errorsTitle') }}
            </div>
            <ul class="mt-2 list-disc space-y-1 pl-4">
              <li v-for="message in formErrors" :key="message">{{ message }}</li>
            </ul>
          </div>
          <div
            v-if="formWarnings.length"
            class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"
          >
            <div class="text-xs font-semibold uppercase text-amber-700">
              {{ t('inventory.validation.warningsTitle') }}
            </div>
            <ul class="mt-2 list-disc space-y-1 pl-4">
              <li v-for="message in formWarnings" :key="message">{{ message }}</li>
            </ul>
          </div>

          <div class="flex flex-wrap gap-3 pt-2">
            <UButton type="submit" color="primary" :disabled="formErrors.length > 0">
              {{ editingItem ? t('inventory.actions.save') : t('inventory.actions.add') }}
            </UButton>
            <UButton type="button" color="gray" variant="outline" @click="resetForm">
              {{ t('inventory.actions.clear') }}
            </UButton>
          </div>
        </form>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('inventory.listTitle') }}</h2>
        <div v-if="store.items.length === 0" class="mt-4 text-sm text-slate-500">
          {{ t('inventory.empty') }}
        </div>
        <div v-else class="mt-4 space-y-3">
          <div
            v-for="item in store.items"
            :key="item.item_id"
            class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-slate-900">
                  {{ item.name }}
                </div>
                <div class="text-xs text-slate-500">{{ item.item_type }} · {{ categoryName(item.category_id) }}</div>
                <div class="mt-2 text-xs text-slate-500">
                  {{ t('inventory.totalStock') }}: {{ totalQuantity(item.item_id) }}
                </div>
              </div>
              <div class="flex gap-2">
                <UButton size="xs" color="gray" variant="outline" @click="startEdit(item)">{{
                  t('inventory.actions.edit')
                }}</UButton>
                <UButton size="xs" color="red" variant="outline" @click="removeItem(item.item_id)">{{
                  t('inventory.actions.delete')
                }}</UButton>
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
import { useInventoryStore, type CategoryInput, type ItemInput } from '~/stores/inventory'
import type { Item, ItemAttachment } from '~/types/database'
import { createId } from '~/utils/id'

const store = useInventoryStore()
const { t } = useI18n()
const localePath = useLocalePath()

const defaultForm = (): ItemInput => ({
  name: '',
  description: '',
  price: 0,
  cost: 0,
  category_id: null,
  location_id: null,
  item_type: 'PRODUCT',
  is_for_maintenance: false,
  min_stock_level: 5,
  reorder_quantity: 10,
  stock_location: 'BOTH',
  sku: '',
  barcode: '',
  weight: null,
  dimensions: '',
  manufacturer: '',
  warranty_period: null,
  inventory_location_id: null,
  initial_quantity: 0
})

const form = ref<ItemInput>(defaultForm())
const editingItem = ref<Item | null>(null)
const isCategoryFormOpen = ref(false)
const categoryFormError = ref('')
const categoryForm = ref<CategoryInput>({
  name: '',
  description: '',
  category_type: 'PRODUCT'
})

type PendingAttachment = {
  temp_id: string
  file_name: string
  file_type: string
  file_size: number
  data_url: string
}

const pendingAttachments = ref<PendingAttachment[]>([])
const attachmentErrors = ref<string[]>([])
const maxAttachmentSize = 5 * 1024 * 1024
const allowedAttachmentTypes = ['image/', 'application/pdf']
const draggingAttachmentId = ref<string | null>(null)
const dragOverAttachmentId = ref<string | null>(null)
const draggingPendingId = ref<string | null>(null)
const dragOverPendingId = ref<string | null>(null)

const categoryName = (categoryId?: string | null) => {
  if (!categoryId) {
    return t('inventory.options.uncategorized')
  }
  return (
    store.categories.find((category) => category.category_id === categoryId)?.name ??
    t('inventory.options.uncategorized')
  )
}

const existingAttachments = computed<ItemAttachment[]>(() => {
  if (!editingItem.value) {
    return []
  }
  const entries = store.attachments.filter((entry) => entry.item_id === editingItem.value?.item_id)
  return [...entries].sort((a, b) => {
    const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0)
    if (orderDiff !== 0) {
      return orderDiff
    }
    return (a.created_at ?? '').localeCompare(b.created_at ?? '')
  })
})

const formErrors = computed(() => {
  const errors: string[] = []
  if (!form.value.name.trim()) {
    errors.push(t('inventory.validation.nameRequired'))
  }
  if (form.value.price < 0) {
    errors.push(t('inventory.validation.priceNonNegative'))
  }
  if (form.value.cost < 0) {
    errors.push(t('inventory.validation.costNonNegative'))
  }
  if ((form.value.initial_quantity ?? 0) < 0) {
    errors.push(t('inventory.validation.quantityNonNegative'))
  }
  if (!form.value.inventory_location_id && (form.value.initial_quantity ?? 0) > 0) {
    errors.push(t('inventory.validation.locationRequired'))
  }
  if (form.value.min_stock_level < 0) {
    errors.push(t('inventory.validation.minStockNonNegative'))
  }
  if (form.value.reorder_quantity < 0) {
    errors.push(t('inventory.validation.reorderNonNegative'))
  }
  return errors
})

const formWarnings = computed(() => {
  const warnings: string[] = []
  if (form.value.cost > form.value.price) {
    warnings.push(t('inventory.validation.costHigherThanPrice'))
  }
  if (form.value.reorder_quantity < form.value.min_stock_level) {
    warnings.push(t('inventory.validation.reorderBelowMin'))
  }
  return warnings
})

const isImageAttachment = (fileType: string) => fileType.startsWith('image/')

const totalQuantity = (itemId: string) => {
  return store.inventory
    .filter((entry) => entry.item_id === itemId)
    .reduce((sum, entry) => sum + entry.quantity, 0)
}

const resetForm = () => {
  form.value = defaultForm()
  editingItem.value = null
  pendingAttachments.value = []
  attachmentErrors.value = []
  draggingAttachmentId.value = null
  dragOverAttachmentId.value = null
  draggingPendingId.value = null
  dragOverPendingId.value = null
  isCategoryFormOpen.value = false
  categoryFormError.value = ''
  categoryForm.value = { name: '', description: '', category_type: 'PRODUCT' }
}

const startEdit = (item: Item) => {
  editingItem.value = item
  pendingAttachments.value = []
  attachmentErrors.value = []
  draggingAttachmentId.value = null
  dragOverAttachmentId.value = null
  draggingPendingId.value = null
  dragOverPendingId.value = null
  isCategoryFormOpen.value = false
  categoryFormError.value = ''
  const inventoryRow = store.inventory.find((entry) => entry.item_id === item.item_id)

  form.value = {
    ...defaultForm(),
    item_id: item.item_id,
    name: item.name,
    description: item.description ?? '',
    price: item.price,
    cost: item.cost,
    category_id: item.category_id ?? null,
    location_id: item.location_id ?? null,
    item_type: item.item_type,
    is_for_maintenance: item.is_for_maintenance,
    min_stock_level: item.min_stock_level,
    reorder_quantity: item.reorder_quantity,
    stock_location: item.stock_location,
    sku: item.sku ?? '',
    barcode: item.barcode ?? '',
    weight: item.weight ?? null,
    dimensions: item.dimensions ?? '',
    manufacturer: item.manufacturer ?? '',
    warranty_period: item.warranty_period ?? null,
    inventory_location_id: inventoryRow?.location_id ?? null,
    initial_quantity: inventoryRow?.quantity ?? 0
  }
}

const toggleCategoryForm = () => {
  isCategoryFormOpen.value = !isCategoryFormOpen.value
  categoryFormError.value = ''
}

const cancelCategoryForm = () => {
  isCategoryFormOpen.value = false
  categoryFormError.value = ''
  categoryForm.value = { name: '', description: '', category_type: 'PRODUCT' }
}

const saveCategory = async () => {
  if (!categoryForm.value.name.trim()) {
    categoryFormError.value = t('inventory.validation.categoryNameRequired')
    return
  }

  const created = await store.createCategory({
    name: categoryForm.value.name.trim(),
    description: categoryForm.value.description?.trim() || null,
    category_type: categoryForm.value.category_type
  })
  form.value.category_id = created.category_id
  cancelCategoryForm()
}

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const moveInArray = <T,>(items: T[], from: number, to: number) => {
  const next = [...items]
  const [removed] = next.splice(from, 1)
  next.splice(to, 0, removed)
  return next
}

const handleAttachmentDragStart = (attachmentId: string) => {
  draggingAttachmentId.value = attachmentId
}

const handleAttachmentDragOver = (attachmentId: string) => {
  dragOverAttachmentId.value = attachmentId
}

const handleAttachmentDragEnd = () => {
  draggingAttachmentId.value = null
  dragOverAttachmentId.value = null
}

const handleAttachmentDrop = async (attachmentId: string) => {
  if (!editingItem.value || !draggingAttachmentId.value) {
    return
  }
  if (draggingAttachmentId.value === attachmentId) {
    handleAttachmentDragEnd()
    return
  }
  const ordered = existingAttachments.value
  const fromIndex = ordered.findIndex((entry) => entry.attachment_id === draggingAttachmentId.value)
  const toIndex = ordered.findIndex((entry) => entry.attachment_id === attachmentId)
  if (fromIndex === -1 || toIndex === -1) {
    handleAttachmentDragEnd()
    return
  }
  const nextOrder = moveInArray(ordered, fromIndex, toIndex)
  await store.reorderAttachments(
    editingItem.value.item_id,
    nextOrder.map((entry) => entry.attachment_id)
  )
  handleAttachmentDragEnd()
}

const handlePendingDragStart = (tempId: string) => {
  draggingPendingId.value = tempId
}

const handlePendingDragOver = (tempId: string) => {
  dragOverPendingId.value = tempId
}

const handlePendingDragEnd = () => {
  draggingPendingId.value = null
  dragOverPendingId.value = null
}

const handlePendingDrop = (tempId: string) => {
  if (!draggingPendingId.value) {
    return
  }
  if (draggingPendingId.value === tempId) {
    handlePendingDragEnd()
    return
  }
  const fromIndex = pendingAttachments.value.findIndex((entry) => entry.temp_id === draggingPendingId.value)
  const toIndex = pendingAttachments.value.findIndex((entry) => entry.temp_id === tempId)
  if (fromIndex === -1 || toIndex === -1) {
    handlePendingDragEnd()
    return
  }
  pendingAttachments.value = moveInArray(pendingAttachments.value, fromIndex, toIndex)
  handlePendingDragEnd()
}

const toDataUrl = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

const handleAttachmentSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  attachmentErrors.value = []

  if (!files.length) {
    return
  }

  const nextAttachments: PendingAttachment[] = []

  for (const file of files) {
    const allowed = allowedAttachmentTypes.some((type) =>
      type.endsWith('/') ? file.type.startsWith(type) : file.type === type
    )
    if (!allowed) {
      attachmentErrors.value.push(t('inventory.attachments.errors.invalidType', { name: file.name }))
      continue
    }
    if (file.size > maxAttachmentSize) {
      attachmentErrors.value.push(t('inventory.attachments.errors.tooLarge', { name: file.name }))
      continue
    }
    const dataUrl = await toDataUrl(file)
    nextAttachments.push({
      temp_id: createId(),
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      data_url: dataUrl
    })
  }

  if (nextAttachments.length) {
    pendingAttachments.value = [...pendingAttachments.value, ...nextAttachments]
  }

  input.value = ''
}

const removePendingAttachment = (tempId: string) => {
  pendingAttachments.value = pendingAttachments.value.filter((entry) => entry.temp_id !== tempId)
}

const removeAttachment = async (attachmentId: string) => {
  await store.removeAttachment(attachmentId)
}

const persistPendingAttachments = async (itemId: string) => {
  if (!pendingAttachments.value.length) {
    return
  }

  const startOrder =
    store.attachments
      .filter((entry) => entry.item_id === itemId)
      .reduce((max, entry) => Math.max(max, entry.sort_order ?? 0), -1) + 1

  await Promise.all(
    pendingAttachments.value.map((attachment, index) =>
      store.addAttachment({
        item_id: itemId,
        file_name: attachment.file_name,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
        data_url: attachment.data_url,
        sort_order: startOrder + index
      })
    )
  )
  pendingAttachments.value = []
}

const handleSubmit = async () => {
  if (formErrors.value.length > 0) {
    return
  }

  if (editingItem.value) {
    const updated: Item = {
      ...editingItem.value,
      name: form.value.name,
      description: form.value.description ?? null,
      price: form.value.price,
      cost: form.value.cost,
      category_id: form.value.category_id ?? null,
      location_id: form.value.location_id ?? null,
      item_type: form.value.item_type,
      is_for_maintenance: form.value.is_for_maintenance,
      min_stock_level: form.value.min_stock_level,
      reorder_quantity: form.value.reorder_quantity,
      stock_location: form.value.stock_location,
      sku: form.value.sku ?? null,
      barcode: form.value.barcode ?? null,
      weight: form.value.weight ?? null,
      dimensions: form.value.dimensions ?? null,
      manufacturer: form.value.manufacturer ?? null,
      warranty_period: form.value.warranty_period ?? null
    }

    await store.updateItem(updated)
    if (form.value.inventory_location_id) {
      await store.upsertInventory(updated.item_id, form.value.inventory_location_id, form.value.initial_quantity ?? 0)
    }
    await persistPendingAttachments(updated.item_id)
  } else {
    const created = await store.createItem(form.value)
    await persistPendingAttachments(created.item_id)
  }

  resetForm()
}

const removeItem = async (itemId: string) => {
  await store.deleteItem(itemId)
  if (editingItem.value?.item_id === itemId) {
    resetForm()
  }
}

onMounted(async () => {
  if (!store.isLoaded) {
    await store.loadAll()
  }
})
</script>
