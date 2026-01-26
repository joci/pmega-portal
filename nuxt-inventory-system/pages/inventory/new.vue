<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('inventory.formTitleAdd') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('inventory.subtitle') }}</p>
      </div>
      <NuxtLink :to="localePath('/inventory')" class="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
        {{ t('inventory.actions.backToList') }}
      </NuxtLink>
    </div>

    <InventoryForm :redirect-to="'/inventory'" />
  </section>
</template>

<script setup lang="ts">
import InventoryForm from '~/components/inventory/InventoryForm.vue'

const { t } = useI18n()
const localePath = useLocalePath()
</script>
