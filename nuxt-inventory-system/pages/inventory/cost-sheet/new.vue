<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">
          {{ isEditing ? t('inventory.costSheetPage.editTitle') : t('inventory.costSheetPage.newTitle') }}
        </h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('inventory.costSheetPage.subtitle') }}</p>
      </div>
      <NuxtLink
        :to="localePath('/inventory/cost-sheet')"
        class="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
      >
        {{ t('inventory.costSheetPage.backToList') }}
      </NuxtLink>
    </div>

    <CostSheetForm />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CostSheetForm from '~/components/inventory/CostSheetForm.vue'

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()

const isEditing = computed(() => typeof route.query.entry === 'string' && route.query.entry.length > 0)
</script>
