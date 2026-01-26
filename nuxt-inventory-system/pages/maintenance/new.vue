<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">
          {{ isEditing ? t('maintenance.form.editTitle') : t('maintenance.new') }}
        </h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('maintenance.subtitle') }}</p>
      </div>
      <NuxtLink
        :to="localePath('/maintenance')"
        class="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
      >
        {{ t('maintenance.backToList') }}
      </NuxtLink>
    </div>

    <MaintenanceForm />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MaintenanceForm from '~/components/maintenance/MaintenanceForm.vue'

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()

const isEditing = computed(() => typeof route.query.ticket === 'string' && route.query.ticket.length > 0)
</script>
