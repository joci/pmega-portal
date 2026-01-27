<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">{{ t('account.title') }}</h1>
      <p class="text-sm text-slate-600">{{ t('account.subtitle') }}</p>
    </div>

    <UCard>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('account.fields.currentPassword') }}</label>
          <input
            v-model="form.currentPassword"
            type="password"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('account.fields.newPassword') }}</label>
          <input
            v-model="form.newPassword"
            type="password"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('account.fields.confirmPassword') }}</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          />
        </div>

        <div v-if="message" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {{ message }}
        </div>
        <div
          v-if="successMessage"
          class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
        >
          {{ successMessage }}
        </div>

        <div class="flex justify-end">
          <UButton type="submit" color="primary" :loading="isSubmitting">
            {{ t('account.actions.updatePassword') }}
          </UButton>
        </div>
      </form>
    </UCard>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

const { t } = useI18n()

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const isSubmitting = ref(false)
const message = ref('')
const successMessage = ref('')

const handleSubmit = async () => {
  message.value = ''
  successMessage.value = ''

  if (form.newPassword !== form.confirmPassword) {
    message.value = t('account.messages.passwordMismatch')
    return
  }

  isSubmitting.value = true
  try {
    await $fetch('/api/auth/password', {
      method: 'POST',
      body: {
        current_password: form.currentPassword,
        new_password: form.newPassword
      }
    })
    successMessage.value = t('account.messages.updated')
    form.currentPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
  } catch (error: any) {
    const status = error?.data?.statusMessage
    if (status === 'PASSWORD_INVALID') {
      message.value = t('account.messages.currentInvalid')
    } else {
      message.value = t('account.messages.updateFailed')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>
