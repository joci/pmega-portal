<template>
  <section class="grid gap-10 md:grid-cols-[1.2fr,0.8fr] md:items-center">
    <div>
      <h1 class="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
        {{ t('home.heading') }}
      </h1>
      <p class="mt-4 max-w-xl text-base text-slate-600">
        {{ t('home.subheading') }}
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <UButton size="lg" color="primary">
          {{ t('home.ctaPrimary') }}
        </UButton>
        <UButton size="lg" color="gray" variant="outline">
          {{ t('home.ctaSecondary') }}
        </UButton>
      </div>
    </div>
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {{ t('home.snapshotTitle') }}
      </div>
      <ul class="mt-4 space-y-3 text-sm text-slate-700">
        <li class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          {{ t('home.highlightInventory') }}
        </li>
        <li class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          {{ t('home.highlightMaintenance') }}
        </li>
        <li class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          {{ t('home.highlightSales') }}
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>
