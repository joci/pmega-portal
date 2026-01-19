<template>
  <section class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">{{ t('maintenance.title') }}</h1>
      <p class="mt-1 text-sm text-slate-600">{{ t('maintenance.subtitle') }}</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">{{ t('maintenance.form.title') }}</h2>
          <UButton size="sm" color="primary">{{ t('maintenance.new') }}</UButton>
        </div>

        <div v-if="formMessage" class="mt-4">
          <UAlert :color="formMessage.type" :title="formMessage.text" />
        </div>

        <form class="mt-4 space-y-6" @submit.prevent="handleSubmit">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.customerName') }}</label>
              <input
                v-model="customerForm.name"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.customerPhone') }}</label>
              <input
                v-model="customerForm.phone"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.deviceModel') }}</label>
              <input
                v-model="deviceForm.model"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.serial') }}</label>
              <input
                v-model="deviceForm.serial_number"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.priority') }}</label>
              <select
                v-model="ticketForm.priority"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="LOW">{{ t('maintenance.options.low') }}</option>
                <option value="MEDIUM">{{ t('maintenance.options.medium') }}</option>
                <option value="HIGH">{{ t('maintenance.options.high') }}</option>
                <option value="URGENT">{{ t('maintenance.options.urgent') }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.warranty') }}</label>
              <select
                v-model="ticketForm.warranty_status"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="IN_WARRANTY">{{ t('maintenance.options.inWarranty') }}</option>
                <option value="OUT_OF_WARRANTY">{{ t('maintenance.options.outWarranty') }}</option>
                <option value="EXTENDED">{{ t('maintenance.options.extended') }}</option>
              </select>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.location') }}</label>
              <select
                v-model="ticketForm.location_id"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">{{ t('maintenance.options.selectLocation') }}</option>
                <option
                  v-for="location in inventoryStore.locations"
                  :key="location.location_id"
                  :value="location.location_id"
                >
                  {{ location.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.status') }}</label>
              <select
                v-model="ticketForm.status"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="PENDING">{{ t('maintenance.options.pending') }}</option>
                <option value="DIAGNOSIS">{{ t('maintenance.options.diagnosis') }}</option>
                <option value="WAITING_PARTS">{{ t('maintenance.options.waitingParts') }}</option>
                <option value="IN_PROGRESS">{{ t('maintenance.options.inProgress') }}</option>
                <option value="TESTING">{{ t('maintenance.options.testing') }}</option>
                <option value="COMPLETED">{{ t('maintenance.options.completed') }}</option>
                <option value="DELIVERED">{{ t('maintenance.options.delivered') }}</option>
                <option value="CANCELLED">{{ t('maintenance.options.cancelled') }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.problem') }}</label>
            <textarea
              v-model="ticketForm.problem_description"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows="3"
              required
            />
          </div>

          <div class="flex flex-wrap gap-3">
            <UButton type="submit" color="primary">{{ t('maintenance.actions.save') }}</UButton>
            <UButton type="button" color="gray" variant="outline" @click="resetForm">
              {{ t('maintenance.actions.clear') }}
            </UButton>
          </div>
        </form>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('maintenance.listTitle') }}</h2>
        <div v-if="store.tickets.length === 0" class="mt-4 text-sm text-slate-500">
          {{ t('maintenance.empty') }}
        </div>
        <div v-else class="mt-4 space-y-3">
          <div
            v-for="ticket in store.tickets"
            :key="ticket.ticket_id"
            class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-slate-900">
                  {{ ticket.ticket_number ?? ticket.ticket_id }}
                </div>
                <div class="text-xs text-slate-500">
                  {{ ticket.status }} · {{ ticket.priority }}
                </div>
              </div>
              <div class="text-xs text-slate-500">{{ ticket.problem_description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { useMaintenanceStore } from '~/stores/maintenance'

const store = useMaintenanceStore()
const inventoryStore = useInventoryStore()
const { t } = useI18n()

const customerForm = reactive({
  name: '',
  phone: '',
  email: ''
})

const deviceForm = reactive({
  brand: '',
  model: '',
  serial_number: ''
})

const ticketForm = reactive({
  problem_description: '',
  priority: 'MEDIUM' as const,
  warranty_status: 'OUT_OF_WARRANTY' as const,
  status: 'PENDING' as const,
  location_id: ''
})

const formMessage = ref<{ type: 'primary' | 'red'; text: string } | null>(null)

const resetForm = () => {
  customerForm.name = ''
  customerForm.phone = ''
  customerForm.email = ''
  deviceForm.brand = ''
  deviceForm.model = ''
  deviceForm.serial_number = ''
  ticketForm.problem_description = ''
  ticketForm.priority = 'MEDIUM'
  ticketForm.warranty_status = 'OUT_OF_WARRANTY'
  ticketForm.status = 'PENDING'
  ticketForm.location_id = ''
  formMessage.value = null
}

const handleSubmit = async () => {
  formMessage.value = null
  if (!ticketForm.location_id) {
    formMessage.value = { type: 'red', text: t('maintenance.messages.locationRequired') }
    return
  }

  const customerId = await store.createCustomer({
    name: customerForm.name,
    phone: customerForm.phone || null,
    email: customerForm.email || null,
    customer_type: 'MAINTENANCE'
  })

  const deviceId = await store.createCustomerDevice({
    customer_id: customerId,
    brand: deviceForm.brand || null,
    model: deviceForm.model,
    serial_number: deviceForm.serial_number || null
  })

  await store.createTicket({
    customer_id: customerId,
    customer_device_id: deviceId,
    technician_id: null,
    status: ticketForm.status,
    problem_description: ticketForm.problem_description,
    diagnosis: null,
    estimated_cost: null,
    estimated_completion: null,
    repair_cost: null,
    labor_cost: null,
    labor_hours: null,
    payment_status: 'PENDING',
    priority: ticketForm.priority,
    warranty_status: ticketForm.warranty_status,
    location_id: ticketForm.location_id
  })

  formMessage.value = { type: 'primary', text: t('maintenance.messages.saved') }
  resetForm()
}

onMounted(async () => {
  if (!inventoryStore.isLoaded) {
    await inventoryStore.loadAll()
  }
  if (!store.isLoaded) {
    await store.loadAll()
  }
})
</script>
