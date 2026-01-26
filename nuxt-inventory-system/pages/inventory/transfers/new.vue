<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('inventory.transfers.newTitle') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('inventory.transfers.subtitle') }}</p>
      </div>
      <NuxtLink
        :to="localePath('/inventory/transfers')"
        class="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
      >
        {{ t('inventory.transfers.backToList') }}
      </NuxtLink>
    </div>

    <StockTransferForm :redirect-to="'/inventory/transfers'" />
  </section>
</template>

<script setup lang="ts">
import StockTransferForm from '~/components/inventory/StockTransferForm.vue'

const { t } = useI18n()
const localePath = useLocalePath()
</script>
