<template>
  <section class="space-y-8">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('inventory.categories.title') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('inventory.categories.subtitle') }}</p>
      </div>
      <NuxtLink
        :to="localePath('/inventory')"
        class="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
      >
        {{ t('inventory.categories.back') }}
      </NuxtLink>
    </div>

    <div class="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('inventory.categories.newTitle') }}</h2>
        <form class="mt-4 grid gap-4" @submit.prevent="handleCreate">
          <div v-if="newCategoryError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {{ newCategoryError }}
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.categories.fields.name') }}</label>
            <input
              v-model="newCategory.name"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.categories.fields.type') }}
              </label>
              <select
                v-model="newCategory.category_type"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="PRODUCT">{{ t('inventory.options.product') }}</option>
                <option value="SPARE_PART">{{ t('inventory.options.sparePart') }}</option>
                <option value="BOTH">{{ t('inventory.options.both') }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.categories.fields.description') }}
              </label>
              <input
                v-model="newCategory.description"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div class="flex flex-wrap gap-3 pt-2">
            <UButton type="submit" color="primary">
              {{ t('inventory.categories.actions.create') }}
            </UButton>
            <UButton type="button" color="gray" variant="outline" @click="resetNewForm">
              {{ t('inventory.categories.actions.cancel') }}
            </UButton>
          </div>
        </form>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('inventory.categories.listTitle') }}</h2>
        <div v-if="orderedCategories.length === 0" class="mt-4 text-sm text-slate-500">
          {{ t('inventory.categories.empty') }}
        </div>
        <div v-else class="mt-4 space-y-3">
          <div
            v-for="category in orderedCategories"
            :key="category.category_id"
            class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-slate-900">{{ category.name }}</div>
                <div class="text-xs text-slate-500">{{ category.category_type }}</div>
                <div v-if="category.description" class="mt-1 text-xs text-slate-500">
                  {{ category.description }}
                </div>
                <div class="mt-2 text-xs text-slate-500">
                  {{ t('inventory.categories.fields.inUse') }}: {{ usageCount(category.category_id) }}
                </div>
                <div v-if="usageCount(category.category_id) > 0" class="mt-1 text-xs text-amber-600">
                  {{ t('inventory.categories.messages.inUse') }}
                </div>
              </div>
              <div class="flex gap-2">
                <UButton size="xs" color="gray" variant="outline" @click="startEdit(category)">
                  {{ t('inventory.categories.actions.edit') }}
                </UButton>
                <UButton size="xs" color="red" variant="outline" @click="openDeleteDialog(category)">
                  {{ t('inventory.categories.actions.delete') }}
                </UButton>
              </div>
            </div>

            <div v-if="editingCategoryId === category.category_id" class="mt-4 border-t border-slate-200 pt-4">
              <div
                v-if="editCategoryError"
                class="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                {{ editCategoryError }}
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('inventory.categories.fields.name') }}
                  </label>
                  <input
                    v-model="editForm.name"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('inventory.categories.fields.type') }}
                  </label>
                  <select
                    v-model="editForm.category_type"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="PRODUCT">{{ t('inventory.options.product') }}</option>
                    <option value="SPARE_PART">{{ t('inventory.options.sparePart') }}</option>
                    <option value="BOTH">{{ t('inventory.options.both') }}</option>
                  </select>
                </div>
              </div>
              <div class="mt-4">
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.categories.fields.description') }}
                </label>
                <input
                  v-model="editForm.description"
                  class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div class="mt-4 flex flex-wrap gap-3">
                <UButton size="xs" color="primary" @click="saveEdit(category)">
                  {{ t('inventory.categories.actions.update') }}
                </UButton>
                <UButton size="xs" color="gray" variant="outline" @click="cancelEdit">
                  {{ t('inventory.categories.actions.cancel') }}
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UModal v-model:open="isDeleteModalOpen" portal="body">
      <template #content>
        <UCard>
          <template #header>
            <div class="text-sm font-semibold text-slate-900">{{ t('inventory.categories.reassignTitle') }}</div>
          </template>
          <div class="space-y-4 text-sm text-slate-600">
            <p>
              {{ t('inventory.categories.reassignDescription', { count: deleteTargetUsage }) }}
            </p>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.categories.reassignLabel') }}
              </label>
              <select
                v-model="reassignCategoryId"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">{{ t('inventory.options.uncategorized') }}</option>
                <option v-for="category in reassignOptions" :key="category.category_id" :value="category.category_id">
                  {{ category.name }}
                </option>
              </select>
              <p class="mt-1 text-xs text-slate-500">{{ t('inventory.categories.reassignHelp') }}</p>
            </div>
          </div>
          <template #footer>
            <div class="flex flex-wrap gap-3">
              <UButton color="red" @click="confirmDelete">
                {{ t('inventory.categories.reassignAction') }}
              </UButton>
              <UButton color="gray" variant="outline" @click="closeDeleteDialog">
                {{ t('inventory.categories.actions.cancel') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useInventoryStore, type CategoryInput } from '~/stores/inventory'
import type { Category } from '~/types/database'

const store = useInventoryStore()
const { t } = useI18n()
const localePath = useLocalePath()

const newCategory = ref<CategoryInput>({
  name: '',
  description: '',
  category_type: 'PRODUCT'
})
const newCategoryError = ref('')

const editingCategoryId = ref<string | null>(null)
const editForm = ref<CategoryInput>({
  name: '',
  description: '',
  category_type: 'PRODUCT'
})
const editCategoryError = ref('')
const isDeleteModalOpen = ref(false)
const deleteTarget = ref<Category | null>(null)
const reassignCategoryId = ref('')

const orderedCategories = computed(() =>
  [...store.categories].sort((a, b) => a.name.localeCompare(b.name))
)

const reassignOptions = computed(() => {
  if (!deleteTarget.value) {
    return []
  }
  return store.categories.filter((entry) => entry.category_id !== deleteTarget.value?.category_id)
})

const deleteTargetUsage = computed(() => {
  if (!deleteTarget.value) {
    return 0
  }
  return usageCount(deleteTarget.value.category_id)
})

const usageMap = computed(() => {
  const map = new Map<string, number>()
  for (const item of store.items) {
    if (!item.category_id) {
      continue
    }
    map.set(item.category_id, (map.get(item.category_id) ?? 0) + 1)
  }
  return map
})

const usageCount = (categoryId: string) => usageMap.value.get(categoryId) ?? 0

const resetNewForm = () => {
  newCategory.value = { name: '', description: '', category_type: 'PRODUCT' }
  newCategoryError.value = ''
}

const handleCreate = async () => {
  if (!newCategory.value.name.trim()) {
    newCategoryError.value = t('inventory.categories.messages.nameRequired')
    return
  }
  await store.createCategory({
    name: newCategory.value.name.trim(),
    description: newCategory.value.description?.trim() || null,
    category_type: newCategory.value.category_type
  })
  resetNewForm()
}

const startEdit = (category: Category) => {
  editingCategoryId.value = category.category_id
  editForm.value = {
    name: category.name,
    description: category.description ?? '',
    category_type: category.category_type
  }
  editCategoryError.value = ''
}

const cancelEdit = () => {
  editingCategoryId.value = null
  editCategoryError.value = ''
  editForm.value = { name: '', description: '', category_type: 'PRODUCT' }
}

const saveEdit = async (category: Category) => {
  if (!editForm.value.name.trim()) {
    editCategoryError.value = t('inventory.categories.messages.nameRequired')
    return
  }
  await store.updateCategory({
    ...category,
    name: editForm.value.name.trim(),
    description: editForm.value.description?.trim() || null,
    category_type: editForm.value.category_type
  })
  cancelEdit()
}

const openDeleteDialog = async (category: Category) => {
  if (usageCount(category.category_id) === 0) {
    await store.deleteCategory(category.category_id)
    if (editingCategoryId.value === category.category_id) {
      cancelEdit()
    }
    return
  }
  deleteTarget.value = category
  reassignCategoryId.value = reassignOptions.value[0]?.category_id ?? ''
  isDeleteModalOpen.value = true
}

const closeDeleteDialog = () => {
  isDeleteModalOpen.value = false
  deleteTarget.value = null
  reassignCategoryId.value = ''
}

const confirmDelete = async () => {
  if (!deleteTarget.value) {
    return
  }
  await store.reassignCategory(deleteTarget.value.category_id, reassignCategoryId.value || null)
  await store.deleteCategory(deleteTarget.value.category_id)
  if (editingCategoryId.value === deleteTarget.value.category_id) {
    cancelEdit()
  }
  closeDeleteDialog()
}

onMounted(async () => {
  if (!store.isLoaded) {
    await store.loadAll()
  }
})
</script>
