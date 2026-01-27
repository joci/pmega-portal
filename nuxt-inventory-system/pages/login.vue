<template>
  <section class="space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-semibold text-slate-900">{{ t('auth.title') }}</h1>
      <p class="mt-1 text-sm text-slate-600">
        {{ isBootstrapMode ? t('auth.bootstrapSubtitle') : t('auth.subtitle') }}
      </p>
    </div>

    <UCard>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="isBootstrapMode" class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('auth.fields.name') }}</label>
            <input
              v-model="bootstrapForm.name"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('auth.fields.username') }}</label>
            <input
              v-model="bootstrapForm.username"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
        </div>

        <div v-if="isBootstrapMode" class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('auth.fields.email') }}</label>
            <input
              v-model="bootstrapForm.email"
              type="email"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div />
        </div>
        <div v-else>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('auth.fields.identifier') }}</label>
          <input
            v-model="loginForm.identifier"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          />
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('auth.fields.password') }}</label>
            <input
              v-model="activePassword"
              type="password"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div v-if="isBootstrapMode">
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('auth.fields.confirmPassword') }}</label>
            <input
              v-model="bootstrapForm.confirmPassword"
              type="password"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
        </div>

        <div v-if="message" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {{ message }}
        </div>

        <div class="flex flex-wrap gap-3">
          <UButton type="submit" color="primary" :loading="isSubmitting">
            {{ isBootstrapMode ? t('auth.actions.bootstrap') : t('auth.actions.login') }}
          </UButton>
        </div>
      </form>
    </UCard>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

const { t } = useI18n()
const localePath = useLocalePath()
const { login } = useAuth()

const isBootstrapMode = ref(false)
const isSubmitting = ref(false)
const message = ref('')

const loginForm = reactive({
  identifier: '',
  password: ''
})

const bootstrapForm = reactive({
  name: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: ''
})

const activePassword = computed({
  get: () => (isBootstrapMode.value ? bootstrapForm.password : loginForm.password),
  set: (value: string) => {
    if (isBootstrapMode.value) {
      bootstrapForm.password = value
    } else {
      loginForm.password = value
    }
  }
})

const handleSubmit = async () => {
  message.value = ''
  isSubmitting.value = true
  try {
    if (isBootstrapMode.value) {
      if (bootstrapForm.password !== bootstrapForm.confirmPassword) {
        message.value = t('auth.messages.passwordMismatch')
        return
      }
      await $fetch('/api/auth/bootstrap', {
        method: 'POST',
        body: {
          name: bootstrapForm.name,
          email: bootstrapForm.email,
          username: bootstrapForm.username,
          password: bootstrapForm.password
        }
      })
    } else {
      await login(loginForm.identifier, loginForm.password)
    }
    await navigateTo(localePath('/'))
  } catch (error: any) {
    message.value = t('auth.messages.loginFailed')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  try {
    const payload = await $fetch<{ needs_setup: boolean }>('/api/auth/bootstrap')
    isBootstrapMode.value = payload.needs_setup
  } catch {
    isBootstrapMode.value = false
  }
})
</script>
