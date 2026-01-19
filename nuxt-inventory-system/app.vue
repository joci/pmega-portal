<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <NuxtLoadingIndicator />
    <NuxtRouteAnnouncer />
    <header class="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div class="mx-auto max-w-[91.5rem] px-4 py-4 sm:px-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div class="text-base font-semibold sm:text-lg">{{ t('app.title') }}</div>
            <div class="text-xs text-slate-500 sm:text-sm">{{ t('app.tagline') }}</div>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2 sm:gap-3">
              <label class="text-xs text-slate-500" for="lang-select">
                {{ t('lang.label') }}
              </label>
              <select
                id="lang-select"
                v-model="selectedLocale"
                class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none"
              >
                <option v-for="opt in localeOptions" :key="opt.code" :value="opt.code">
                  {{ opt.name }}
                </option>
              </select>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 md:hidden"
              :aria-expanded="isMenuOpen"
              aria-controls="primary-nav"
              @click="isMenuOpen = !isMenuOpen"
            >
              {{ isMenuOpen ? t('nav.menuClose') : t('nav.menuOpen') }}
            </button>
          </div>
        </div>
      </div>
      <nav class="border-t border-slate-200">
        <div class="mx-auto max-w-[91.5rem] px-4 sm:px-6">
          <div class="hidden gap-6 py-3 text-sm text-slate-600 md:flex">
            <NuxtLink :to="localePath('/inventory')" class="hover:text-slate-900">
              {{ t('nav.inventory') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/sales')" class="hover:text-slate-900">
              {{ t('nav.sales') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/maintenance')" class="hover:text-slate-900">
              {{ t('nav.maintenance') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/reports')" class="hover:text-slate-900">
              {{ t('nav.reports') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/settings')" class="hover:text-slate-900">
              {{ t('nav.settings') }}
            </NuxtLink>
          </div>
          <div
            id="primary-nav"
            class="overflow-hidden transition-[max-height,opacity] duration-300 md:hidden"
            :class="isMenuOpen ? 'max-h-96 py-4 opacity-100' : 'max-h-0 py-0 opacity-0'"
          >
            <div class="flex flex-col gap-3 text-sm font-medium text-slate-700">
              <NuxtLink :to="localePath('/inventory')" class="rounded-lg px-2 py-2 hover:bg-slate-100">
                {{ t('nav.inventory') }}
              </NuxtLink>
              <NuxtLink :to="localePath('/sales')" class="rounded-lg px-2 py-2 hover:bg-slate-100">
                {{ t('nav.sales') }}
              </NuxtLink>
              <NuxtLink :to="localePath('/maintenance')" class="rounded-lg px-2 py-2 hover:bg-slate-100">
                {{ t('nav.maintenance') }}
              </NuxtLink>
              <NuxtLink :to="localePath('/reports')" class="rounded-lg px-2 py-2 hover:bg-slate-100">
                {{ t('nav.reports') }}
              </NuxtLink>
              <NuxtLink :to="localePath('/settings')" class="rounded-lg px-2 py-2 hover:bg-slate-100">
                {{ t('nav.settings') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </nav>
    </header>
    <main class="mx-auto max-w-[91.5rem] px-4 py-8 sm:px-6 sm:py-10">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const { locale, locales, t, setLocale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()

const localeOptions = computed(() =>
  locales.value.map((entry) =>
    typeof entry === 'string' ? { code: entry, name: entry } : entry
  )
)

const isMenuOpen = ref(false)

const selectedLocale = computed({
  get: () => locale.value,
  set: (code) => {
    const target = switchLocalePath(code)
    if (target) {
      void navigateTo(target)
      return
    }
    void setLocale(code)
  }
})
</script>
