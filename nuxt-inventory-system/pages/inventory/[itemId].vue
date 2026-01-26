<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('inventory.formTitleEdit') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('inventory.subtitle') }}</p>
      </div>
      <NuxtLink :to="localePath('/inventory')" class="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
        {{ t('inventory.actions.backToList') }}
      </NuxtLink>
    </div>

    <InventoryForm :item-id="itemId" :redirect-to="'/inventory'" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import InventoryForm from '~/components/inventory/InventoryForm.vue'

const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()

const itemId = computed(() => {
  const raw = route.params.itemId
  return Array.isArray(raw) ? raw[0] : String(raw ?? '')
})
</script>
