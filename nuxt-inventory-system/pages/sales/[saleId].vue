<template>
  <section class="space-y-8">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('sales.detail.title') }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ t('sales.detail.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-3 text-sm font-semibold">
        <NuxtLink
          v-if="canEditSale"
          :to="localePath({ path: '/sales/new', query: { sale: sale.sale_id } })"
          class="text-emerald-600 hover:text-emerald-700"
        >
          {{ t('sales.list.edit') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/sales')" class="text-emerald-600 hover:text-emerald-700">
          {{ t('sales.backToList') }}
        </NuxtLink>
      </div>
    </div>

    <div v-if="!canViewSales" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('permissions.noAccess') }}
    </div>

    <div
      v-else-if="!salesStore.isLoaded"
      class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500"
    >
      {{ t('sales.detail.loading') }}
    </div>

    <div v-else-if="!sale" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('sales.detail.notFound') }}
    </div>

    <div v-else class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('sales.detail.summaryTitle') }}</h2>
      </div>

      <div class="mt-4 grid gap-4 text-sm text-slate-700 md:grid-cols-3">
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.detail.saleNumber') }}</label>
          <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {{ sale.sale_number ?? sale.sale_id }}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.detail.receiptNumber') }}</label>
          <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {{ sale.receipt_number || '-' }}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.detail.employeeName') }}</label>
          <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {{ sale.performed_by || '-' }}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.detail.saleDate') }}</label>
          <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {{ formatDate(sale.sale_date ?? sale.created_at) }}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.detail.saleType') }}</label>
          <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {{ saleTypeLabel(sale.sale_type) }}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.detail.status') }}</label>
          <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {{ sale.status }}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.detail.paymentStatus') }}</label>
          <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {{ sale.payment_status }}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.detail.paymentMethod') }}</label>
          <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {{ paymentMethodLabel(sale.payment_method) }}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.detail.location') }}</label>
          <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {{ locationName(sale.location_id) }}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.detail.customerName') }}</label>
          <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {{ sale.customer_name || '-' }}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.detail.customerPhone') }}</label>
          <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {{ sale.customer_phone || '-' }}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.detail.customerId') }}</label>
          <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {{ sale.customer_id || '-' }}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.detail.customerTin') }}</label>
          <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {{ sale.customer_tin || '-' }}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('sales.detail.customerVatRegistration') }}
          </label>
          <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {{ sale.customer_vat_registration_no || '-' }}
          </div>
        </div>
      </div>

      <div class="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {{ t('sales.detail.lineItemsTitle') }}
        </div>
        <div v-if="saleLines.length === 0" class="mt-3 text-sm text-slate-500">
          {{ t('sales.form.noLines') }}
        </div>
        <div v-else class="mt-4 overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th class="py-2 pr-4">{{ t('sales.fields.item') }}</th>
                <th class="py-2 pr-4">{{ t('sales.fields.unit') }}</th>
                <th class="py-2 pr-4 text-right">{{ t('sales.fields.quantity') }}</th>
                <th class="py-2 pr-4 text-right">{{ t('sales.fields.unitPrice') }}</th>
                <th class="py-2 text-right">{{ t('sales.fields.lineTotal') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in saleLines" :key="line.sale_item_id" class="border-b border-slate-100">
                <td class="py-3 pr-4">
                  <div class="font-semibold text-slate-900">{{ lineLabel(line) }}</div>
                </td>
                <td class="py-3 pr-4 text-sm text-slate-700">{{ lineUnit(line) }}</td>
                <td class="py-3 pr-4 text-right text-sm text-slate-700">{{ line.quantity }}</td>
                <td class="py-3 pr-4 text-right text-sm text-slate-700">{{ formatCurrency(line.unit_price) }}</td>
                <td class="py-3 text-right text-sm text-slate-700">{{ formatCurrency(line.line_total) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div class="w-full md:max-w-md">
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.notes') }}</label>
              <textarea
                :value="sale.notes || ''"
                rows="3"
                readonly
                class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </div>
            <div class="w-full md:max-w-md">
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.attachments') }}</label>
              <div class="mt-2 space-y-2 text-sm text-slate-700">
                <div v-if="saleAttachments.length === 0" class="text-slate-500">-</div>
                <a
                  v-for="attachment in saleAttachments"
                  :key="attachment.attachment_id"
                  :href="attachment.data_url"
                  target="_blank"
                  rel="noreferrer"
                  class="block text-emerald-600 hover:text-emerald-700"
                >
                  {{ attachment.file_name }}
                </a>
              </div>
            </div>
            <div class="w-full max-w-xs space-y-2 text-sm text-slate-600">
              <div class="flex items-center justify-between gap-3">
                <span class="font-semibold text-slate-500">{{ t('sales.detail.subtotal') }}</span>
                <span class="font-semibold text-slate-900">{{ formatCurrency(subtotal) }}</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="font-semibold text-slate-500">{{ t('sales.summary.discount') }}</span>
                <span class="font-semibold text-slate-900">{{ formatCurrency(discount) }}</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="font-semibold text-slate-500">{{ t('sales.summary.vat') }}</span>
                <span class="font-semibold text-slate-900">{{ formatCurrency(vatAmount) }}</span>
              </div>
              <div class="flex items-center justify-between border-t border-slate-200 pt-2 text-base">
                <span class="font-semibold text-slate-700">{{ t('sales.detail.total') }}</span>
                <span class="font-semibold text-slate-900">{{ formatCurrency(total) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { useSalesStore } from '~/stores/sales'
import { usePermissions } from '~/composables/usePermissions'
import { useAuth } from '~/composables/useAuth'
import type { SaleAttachment, SaleItem, Sale, PaymentMethod } from '~/types/database'

const route = useRoute()
const inventoryStore = useInventoryStore()
const salesStore = useSalesStore()
const { can, loadPermissions } = usePermissions()
const { user } = useAuth()
const { locale, t } = useI18n()
const localePath = useLocalePath()

const canViewSales = computed(() => can('sales.view'))
const canCreateSales = computed(() => can('sales.create'))
const isAdmin = computed(() => user.value?.role === 'admin')
const saleId = computed(() => String(route.params.saleId || ''))

const sale = computed(() => salesStore.sales.find((entry) => entry.sale_id === saleId.value))
const saleLines = computed(() => salesStore.saleItems.filter((line) => line.sale_id === saleId.value))
const saleAttachments = computed<SaleAttachment[]>(() =>
  salesStore.attachments.filter((attachment) => attachment.sale_id === saleId.value)
)

const canEditSale = computed(() => {
  if (!sale.value || !canCreateSales.value) {
    return false
  }
  return sale.value.status !== 'COMPLETED' || isAdmin.value
})

const subtotal = computed(() => {
  if (sale.value?.subtotal_amount != null) {
    return sale.value.subtotal_amount
  }
  return saleLines.value.reduce((sum, line) => sum + (line.line_total || 0), 0)
})

const discount = computed(() => sale.value?.discount_amount ?? 0)
const vatAmount = computed(() => sale.value?.tax_amount ?? 0)
const total = computed(() => {
  if (sale.value?.total_amount != null) {
    return sale.value.total_amount
  }
  return subtotal.value - discount.value + vatAmount.value
})

const saleTypeLabel = (value: Sale['sale_type']) => {
  switch (value) {
    case 'MAINTENANCE':
      return t('sales.options.maintenance')
    case 'INTERNAL':
      return t('sales.options.internal')
    case 'RETAIL':
    default:
      return t('sales.options.retail')
  }
}

const paymentMethodLabel = (method?: PaymentMethod | null) => {
  switch (method) {
    case 'CASH':
      return t('sales.options.paymentCash')
    case 'TRANSFER':
      return t('sales.options.paymentTransfer')
    case 'CHECK':
      return t('sales.options.paymentCheck')
    default:
      return method ?? '-'
  }
}

const lineLabel = (line: SaleItem) => {
  if (line.item_id) {
    const item = inventoryStore.items.find((entry) => entry.item_id === line.item_id)
    return item?.name || line.description || t('sales.detail.customLine')
  }
  return line.description || t('sales.detail.customLine')
}

const lineUnit = (line: SaleItem) => {
  if (!line.item_id) {
    return '-'
  }
  const item = inventoryStore.items.find((entry) => entry.item_id === line.item_id)
  return item?.unit || '-'
}

const locationName = (locationId: string) => {
  return inventoryStore.locations.find((entry) => entry.location_id === locationId)?.name ?? '-'
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'ETB' }).format(value || 0)
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleDateString(locale.value)
}

onMounted(async () => {
  await loadPermissions()
  if (!inventoryStore.isLoaded) {
    await inventoryStore.loadAll()
  }
  if (!salesStore.isLoaded) {
    await salesStore.loadAll()
  }
})
</script>
