<template>
  <section class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">{{ t('sales.title') }}</h1>
      <p class="mt-1 text-sm text-slate-600">{{ t('sales.subtitle') }}</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">{{ t('sales.form.title') }}</h2>
          <UButton size="sm" color="primary" @click="addLineItem">{{ t('sales.form.addLine') }}</UButton>
        </div>

        <div v-if="formMessage" class="mt-4">
          <UAlert :color="formMessage.type" :title="formMessage.text" />
        </div>

        <form class="mt-4 space-y-6" @submit.prevent="handleSubmit">
          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.saleType') }}</label>
              <select
                v-model="saleForm.sale_type"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="RETAIL">{{ t('sales.options.retail') }}</option>
                <option value="MAINTENANCE">{{ t('sales.options.maintenance') }}</option>
                <option value="INTERNAL">{{ t('sales.options.internal') }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.status') }}</label>
              <select
                v-model="saleForm.status"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="OPEN">{{ t('sales.options.open') }}</option>
                <option value="COMPLETED">{{ t('sales.options.completed') }}</option>
                <option value="CANCELLED">{{ t('sales.options.cancelled') }}</option>
                <option value="REFUNDED">{{ t('sales.options.refunded') }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.paymentStatus') }}</label>
              <select
                v-model="saleForm.payment_status"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="UNPAID">{{ t('sales.options.unpaid') }}</option>
                <option value="PARTIAL">{{ t('sales.options.partial') }}</option>
                <option value="PAID">{{ t('sales.options.paid') }}</option>
                <option value="REFUNDED">{{ t('sales.options.refunded') }}</option>
              </select>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.location') }}</label>
              <select
                v-model="saleForm.location_id"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">{{ t('sales.options.selectLocation') }}</option>
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
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.customerId') }}</label>
              <input
                v-model="saleForm.customer_id"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                :placeholder="t('sales.placeholders.customerId')"
              />
            </div>
          </div>

          <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {{ t('sales.form.linesTitle') }}
            </div>
            <div v-if="lineItems.length === 0" class="mt-3 text-sm text-slate-500">
              {{ t('sales.form.noLines') }}
            </div>
            <div v-else class="mt-4 space-y-4">
              <div
                v-for="(line, index) in lineItems"
                :key="line.tempId"
                class="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div class="grid gap-4 md:grid-cols-[1.1fr,0.7fr,0.6fr,0.5fr]">
                  <div>
                    <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.item') }}</label>
                    <select
                      v-model="line.item_id"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      @change="setItemDetails(line)"
                    >
                      <option value="">{{ t('sales.options.selectItem') }}</option>
                      <option v-for="item in inventoryStore.items" :key="item.item_id" :value="item.item_id">
                        {{ item.name }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.lineType') }}</label>
                    <select
                      v-model="line.line_type"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="PRODUCT">{{ t('sales.options.product') }}</option>
                      <option value="SPARE_PART">{{ t('sales.options.sparePart') }}</option>
                      <option value="LABOR">{{ t('sales.options.labor') }}</option>
                      <option value="FEE">{{ t('sales.options.fee') }}</option>
                      <option value="ADJUSTMENT">{{ t('sales.options.adjustment') }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.quantity') }}</label>
                    <input
                      v-model.number="line.quantity"
                      type="number"
                      min="1"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.unitPrice') }}</label>
                    <input
                      v-model.number="line.unit_price"
                      type="number"
                      min="0"
                      step="0.01"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div class="text-slate-500">
                    {{ t('sales.fields.lineTotal') }}: {{ formatCurrency(lineTotal(line)) }}
                  </div>
                  <div class="flex items-center gap-2">
                    <UButton size="xs" color="gray" variant="outline" @click="removeLineItem(index)">
                      {{ t('sales.actions.removeLine') }}
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.discount') }}</label>
              <input
                v-model.number="saleForm.discount_amount"
                type="number"
                min="0"
                step="0.01"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.tax') }}</label>
              <input
                v-model.number="saleForm.tax_amount"
                type="number"
                min="0"
                step="0.01"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.total') }}</label>
              <div class="mt-2 text-lg font-semibold text-slate-900">{{ formatCurrency(grandTotal) }}</div>
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.notes') }}</label>
            <textarea
              v-model="saleForm.notes"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows="2"
            />
          </div>

          <div class="flex flex-wrap gap-3">
            <UButton type="submit" color="primary">{{ t('sales.actions.save') }}</UButton>
            <UButton type="button" color="gray" variant="outline" @click="resetForm">
              {{ t('sales.actions.clear') }}
            </UButton>
          </div>
        </form>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('sales.listTitle') }}</h2>
        <div v-if="store.sales.length === 0" class="mt-4 text-sm text-slate-500">
          {{ t('sales.empty') }}
        </div>
        <div v-else class="mt-4 space-y-3">
          <div
            v-for="sale in store.sales"
            :key="sale.sale_id"
            class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-slate-900">{{ sale.sale_number ?? sale.sale_id }}</div>
                <div class="text-xs text-slate-500">{{ sale.sale_type }} · {{ sale.status }}</div>
              </div>
              <div class="text-sm font-semibold text-slate-900">{{ formatCurrency(sale.total_amount) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { useSalesStore } from '~/stores/sales'
import { createId } from '~/utils/id'
import type { SaleItem } from '~/types/database'

type LineDraft = {
  tempId: string
  item_id: string
  line_type: SaleItem['line_type']
  quantity: number
  unit_price: number
  description: string
}

const store = useSalesStore()
const inventoryStore = useInventoryStore()
const { locale, t } = useI18n()

const saleForm = reactive({
  sale_type: 'RETAIL' as const,
  status: 'OPEN' as const,
  payment_status: 'UNPAID' as const,
  location_id: '',
  customer_id: '',
  discount_amount: 0,
  tax_amount: 0,
  notes: ''
})

const lineItems = ref<LineDraft[]>([])
const formMessage = ref<{ type: 'primary' | 'red'; text: string } | null>(null)

const lineTotal = (line: LineDraft) => line.quantity * line.unit_price

const lineSubtotal = computed(() => lineItems.value.reduce((sum, line) => sum + lineTotal(line), 0))

const grandTotal = computed(() => lineSubtotal.value - saleForm.discount_amount + saleForm.tax_amount)

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'USD' }).format(value || 0)
}

const addLineItem = () => {
  lineItems.value.push({
    tempId: createId(),
    item_id: '',
    line_type: 'PRODUCT',
    quantity: 1,
    unit_price: 0,
    description: ''
  })
}

const removeLineItem = (index: number) => {
  lineItems.value.splice(index, 1)
}

const setItemDetails = (line: LineDraft) => {
  const item = inventoryStore.items.find((entry) => entry.item_id === line.item_id)
  if (!item) {
    return
  }
  line.description = item.name
  if (line.unit_price === 0) {
    line.unit_price = item.price
  }
  line.line_type = item.item_type === 'SPARE_PART' ? 'SPARE_PART' : 'PRODUCT'
}

const resetForm = () => {
  saleForm.sale_type = 'RETAIL'
  saleForm.status = 'OPEN'
  saleForm.payment_status = 'UNPAID'
  saleForm.location_id = ''
  saleForm.customer_id = ''
  saleForm.discount_amount = 0
  saleForm.tax_amount = 0
  saleForm.notes = ''
  lineItems.value = []
  formMessage.value = null
}

const handleSubmit = async () => {
  formMessage.value = null
  if (!saleForm.location_id) {
    formMessage.value = { type: 'red', text: t('sales.messages.locationRequired') }
    return
  }
  if (lineItems.value.length === 0) {
    formMessage.value = { type: 'red', text: t('sales.messages.lineRequired') }
    return
  }

  const normalizedItems: SaleItem[] = lineItems.value.map((line) => ({
    sale_item_id: '',
    sale_id: '',
    item_id: line.item_id || null,
    description: line.description || null,
    line_type: line.line_type,
    quantity: line.quantity,
    unit_price: line.unit_price,
    discount_amount: 0,
    tax_amount: 0,
    line_total: lineTotal(line),
    affects_inventory: true
  }))

  await store.createSale(
    {
      sale_type: saleForm.sale_type,
      status: saleForm.status,
      payment_status: saleForm.payment_status,
      customer_id: saleForm.customer_id || null,
      discount_amount: saleForm.discount_amount,
      tax_amount: saleForm.tax_amount,
      subtotal_amount: lineSubtotal.value,
      total_amount: grandTotal.value,
      is_repair_service: false,
      location_id: saleForm.location_id,
      notes: saleForm.notes
    },
    normalizedItems
  )

  formMessage.value = { type: 'primary', text: t('sales.messages.saved') }
  resetForm()
}

onMounted(async () => {
  if (!inventoryStore.isLoaded) {
    await inventoryStore.loadAll()
  }
  if (!store.isLoaded) {
    await store.loadAll()
  }

  if (lineItems.value.length === 0) {
    addLineItem()
  }
})
</script>
