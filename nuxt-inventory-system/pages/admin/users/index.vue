<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('users.title') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('users.subtitle') }}</p>
      </div>
    </div>

    <div v-if="!isAdmin" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('permissions.noAccess') }}
    </div>

    <div v-else class="space-y-6">
      <UCard>
        <template #header>
          <div class="text-sm font-semibold text-slate-900">{{ t('users.createTitle') }}</div>
        </template>
        <form class="grid gap-4 md:grid-cols-2" @submit.prevent="createUser">
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('users.fields.name') }}</label>
            <input v-model="newUser.name" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('users.fields.role') }}</label>
            <select
              v-model="newUser.role"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('users.fields.email') }}</label>
            <input
              v-model="newUser.email"
              type="email"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('users.fields.username') }}</label>
            <input
              v-model="newUser.username"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('users.fields.password') }}</label>
            <input
              v-model="newUser.password"
              type="password"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div class="flex items-end">
            <UButton type="submit" color="primary" :loading="isSaving" :disabled="isSaving">
              {{ t('users.actions.create') }}
            </UButton>
          </div>
        </form>
        <div v-if="message" class="mt-4 text-sm text-rose-600">{{ message }}</div>
        <div v-if="successMessage" class="mt-4 text-sm text-emerald-600">{{ successMessage }}</div>
      </UCard>

      <UCard>
        <template #header>
          <div class="text-sm font-semibold text-slate-900">{{ t('users.listTitle') }}</div>
        </template>
        <div v-if="!users.length" class="text-sm text-slate-500">{{ t('users.empty') }}</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th class="py-2 pr-4">{{ t('users.fields.name') }}</th>
                <th class="py-2 pr-4">{{ t('users.fields.email') }}</th>
                <th class="py-2 pr-4">{{ t('users.fields.username') }}</th>
                <th class="py-2 pr-4">{{ t('users.fields.role') }}</th>
                <th class="py-2 pr-4">{{ t('users.fields.status') }}</th>
                <th class="py-2 text-right">{{ t('users.actions.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in users" :key="entry.user_id" class="border-b border-slate-100">
                <td class="py-3 pr-4">{{ entry.name || '-' }}</td>
                <td class="py-3 pr-4">{{ entry.email }}</td>
                <td class="py-3 pr-4">{{ entry.username }}</td>
                <td class="py-3 pr-4">
                  <select
                    v-model="edits[entry.user_id].role"
                    class="h-9 rounded-lg border border-slate-200 px-2 text-sm"
                  >
                    <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
                  </select>
                </td>
                <td class="py-3 pr-4">
                  <select
                    v-model="edits[entry.user_id].is_active"
                    class="h-9 rounded-lg border border-slate-200 px-2 text-sm"
                  >
                    <option :value="true">{{ t('users.status.active') }}</option>
                    <option :value="false">{{ t('users.status.disabled') }}</option>
                  </select>
                </td>
                <td class="py-3 text-right">
                  <UButton
                    size="xs"
                    color="primary"
                    :loading="savingId === entry.user_id"
                    :disabled="savingId === entry.user_id"
                    @click="saveEdit(entry)"
                  >
                    {{ t('users.actions.update') }}
                  </UButton>
                  <UButton
                    size="xs"
                    color="gray"
                    variant="outline"
                    class="ml-2"
                    @click="openReset(entry)"
                  >
                    {{ t('users.actions.resetPassword') }}
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <UModal v-model:open="isResetOpen" portal="body">
      <template #content>
        <UCard>
          <template #header>
            <div class="text-sm font-semibold text-slate-900">{{ t('users.reset.title') }}</div>
          </template>
          <div class="space-y-4 text-sm">
            <div class="text-slate-600">
              {{ t('users.reset.subtitle') }} <span class="font-semibold text-slate-900">{{ resetUserLabel }}</span>
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('users.reset.newPassword') }}</label>
              <input
                v-model="resetForm.password"
                type="password"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('users.reset.confirmPassword') }}</label>
              <input
                v-model="resetForm.confirmPassword"
                type="password"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div v-if="resetMessage" class="text-sm text-rose-600">{{ resetMessage }}</div>
            <div class="flex justify-end gap-2">
              <UButton color="gray" variant="outline" @click="closeReset">
                {{ t('users.reset.cancel') }}
              </UButton>
              <UButton color="primary" :loading="resetSaving" :disabled="resetSaving" @click="submitReset">
                {{ t('users.reset.submit') }}
              </UButton>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { User } from '~/types/database'

const { t } = useI18n()
const { user } = useAuth()

const roles = ['admin', 'manager', 'staff', 'viewer', 'technician', 'sales', 'maintenance_receiver']
const isAdmin = computed(() => user.value?.role === 'admin')

const users = ref<User[]>([])
const edits = reactive<Record<string, { role: string; is_active: boolean }>>({})
const message = ref('')
const successMessage = ref('')
const { isSubmitting: isSaving, runWithLock: withCreateLock } = useSubmitLock()
const savingId = ref<string | null>(null)
const isResetOpen = ref(false)
const { isSubmitting: resetSaving, runWithLock: withResetLock } = useSubmitLock()
const resetMessage = ref('')
const resetUser = ref<User | null>(null)

const newUser = reactive({
  name: '',
  email: '',
  username: '',
  role: 'staff',
  password: ''
})

const resetForm = reactive({
  password: '',
  confirmPassword: ''
})

const loadUsers = async () => {
  if (!isAdmin.value) {
    return
  }
  const payload = await $fetch<{ users: User[] }>('/api/users')
  users.value = payload.users
  payload.users.forEach((entry) => {
    edits[entry.user_id] = { role: entry.role, is_active: entry.is_active }
  })
}

const createUser = async () => {
  await withCreateLock(async () => {
    message.value = ''
    successMessage.value = ''
    try {
      const payload = await $fetch<{ user: User }>('/api/users', {
        method: 'POST',
        body: {
          name: newUser.name,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
          password: newUser.password
        }
      })
      users.value = [payload.user, ...users.value]
      edits[payload.user.user_id] = { role: payload.user.role, is_active: payload.user.is_active }
      newUser.name = ''
      newUser.email = ''
      newUser.username = ''
      newUser.role = 'staff'
      newUser.password = ''
    } catch (error: any) {
      message.value = t('users.messages.createFailed')
    }
  })
}

const saveEdit = async (entry: User) => {
  message.value = ''
  successMessage.value = ''
  if (savingId.value === entry.user_id) {
    return
  }
  if (!edits[entry.user_id]) {
    return
  }
  savingId.value = entry.user_id
  try {
    const payload = await $fetch<{ user: User }>(`/api/users/${entry.user_id}`, {
      method: 'PUT',
      body: {
        role: edits[entry.user_id].role,
        is_active: edits[entry.user_id].is_active
      }
    })
    users.value = users.value.map((row) => (row.user_id === payload.user.user_id ? payload.user : row))
  } catch (error) {
    message.value = t('users.messages.updateFailed')
  } finally {
    savingId.value = null
  }
}

const resetUserLabel = computed(() => {
  if (!resetUser.value) {
    return ''
  }
  return resetUser.value.name || resetUser.value.username
})

const openReset = (entry: User) => {
  resetUser.value = entry
  resetForm.password = ''
  resetForm.confirmPassword = ''
  resetMessage.value = ''
  isResetOpen.value = true
}

const closeReset = () => {
  isResetOpen.value = false
  resetUser.value = null
}

const submitReset = async () => {
  if (!resetUser.value) {
    return
  }
  await withResetLock(async () => {
    resetMessage.value = ''
    if (!resetForm.password || !resetForm.confirmPassword) {
      resetMessage.value = t('users.reset.passwordRequired')
      return
    }
    if (resetForm.password !== resetForm.confirmPassword) {
      resetMessage.value = t('users.reset.passwordMismatch')
      return
    }
    try {
      await $fetch(`/api/users/${resetUser.value.user_id}/password`, {
        method: 'PUT',
        body: { new_password: resetForm.password }
      })
      successMessage.value = t('users.messages.resetSuccess')
      closeReset()
    } catch (error) {
      resetMessage.value = t('users.messages.resetFailed')
    }
  })
}

onMounted(loadUsers)
</script>
