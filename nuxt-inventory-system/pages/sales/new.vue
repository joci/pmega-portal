<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('sales.new') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('sales.subtitle') }}</p>
      </div>
      <NuxtLink :to="localePath('/sales')" class="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
        {{ t('sales.backToList') }}
      </NuxtLink>
    </div>

    <SalesForm />
  </section>
</template>

<script setup lang="ts">
import SalesForm from '~/components/sales/SalesForm.vue'

const { t } = useI18n()
const localePath = useLocalePath()
</script>
