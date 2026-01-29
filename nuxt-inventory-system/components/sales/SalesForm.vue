<template>
  <div>
    <div v-if="!canViewSales" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('permissions.noAccess') }}
    </div>

    <div v-else class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">
          {{ isEditing ? t('sales.form.editTitle') : t('sales.form.title') }}
        </h2>
      </div>

      <div v-if="formMessage" class="mt-4">
        <UAlert :color="formMessage.type" :title="formMessage.text" />
      </div>
      <div v-else-if="isEditLocked" class="mt-4">
        <UAlert color="red" :title="t('sales.messages.locked')" />
      </div>

      <div v-if="!canCreateSales" class="mt-4 text-xs text-slate-500">
        {{ t('permissions.readOnly') }}
      </div>

      <form class="mt-4 space-y-6" @submit.prevent="handleSubmit">
        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.saleType') }}</label>
            <select
              v-model="saleForm.sale_type"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              :disabled="!canCreateSales || isEditLocked"
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
              :disabled="!canCreateSales || isEditLocked"
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
              :disabled="!canCreateSales || isEditLocked"
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
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('sales.fields.receiptNumber') }}
            </label>
            <input
              v-model="saleForm.receipt_number"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              :disabled="!canCreateSales || isEditLocked"
            />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('sales.fields.paymentMethod') }}
            </label>
            <select
              v-model="saleForm.payment_method"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              :disabled="!canCreateSales || isEditLocked"
            >
              <option value="">{{ t('sales.options.selectPaymentMethod') }}</option>
              <option value="CASH">{{ t('sales.options.paymentCash') }}</option>
              <option value="TRANSFER">{{ t('sales.options.paymentTransfer') }}</option>
              <option value="CHECK">{{ t('sales.options.paymentCheck') }}</option>
            </select>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.employeeName') }}</label>
            <input
              v-model="saleForm.performed_by"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              :disabled="!canCreateSales || isEditLocked || !isAdmin"
              required
            />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.location') }}</label>
            <select
              v-model="saleForm.location_id"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              :disabled="!canCreateSales || isEditLocked"
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
              :disabled="!canCreateSales || isEditLocked"
            />
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.customerName') }}</label>
            <input
              v-model="saleForm.customer_name"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              :disabled="!canCreateSales || isEditLocked"
            />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.customerPhone') }}</label>
            <input
              v-model="saleForm.customer_phone"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              :disabled="!canCreateSales || isEditLocked"
            />
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.customerTin') }}</label>
            <input
              v-model="saleForm.customer_tin"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              :disabled="!canCreateSales || isEditLocked"
            />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('sales.fields.customerVatRegistration') }}
            </label>
            <input
              v-model="saleForm.customer_vat_registration_no"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              :disabled="!canCreateSales || isEditLocked"
            />
          </div>
        </div>

        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">
            {{ t('sales.fields.attachments') }}
          </label>
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            class="mt-1 w-full text-sm"
            @change="handleAttachmentSelect"
            :disabled="!canCreateSales || isEditLocked"
          />
          <div v-if="attachmentErrors.length" class="mt-2 space-y-1 text-xs text-rose-600">
            <div v-for="message in attachmentErrors" :key="message">{{ message }}</div>
          </div>
          <div v-if="saleAttachments.length" class="mt-2 space-y-2">
            <div
              v-for="attachment in saleAttachments"
              :key="attachment.temp_id"
              class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs"
            >
              <div class="text-slate-600">
                {{ attachment.file_name }}
              </div>
              <button
                type="button"
                class="text-xs font-semibold text-rose-600 hover:text-rose-700"
                @click="removeAttachment(attachment.temp_id)"
              >
                {{ t('sales.actions.removeAttachment') }}
              </button>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {{ t('sales.form.linesTitle') }}
            </div>
            <UButton size="xs" color="primary" :disabled="!canCreateSales || lineItemsLocked" @click="addLineItem">
              {{ t('sales.form.addLine') }}
            </UButton>
          </div>
          <div v-if="lineItems.length === 0" class="mt-3 text-sm text-slate-500">
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
                <tr v-for="(line, index) in lineItems" :key="line.tempId" class="border-b border-slate-100">
                  <td class="py-3 pr-4 align-top">
                    <div class="relative">
                      <input
                        v-model="line.item_query"
                        class="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                        :placeholder="t('sales.options.selectItem')"
                        @focus="openItemMenu(line)"
                        @input="handleItemInput(line)"
                        @keydown.enter.prevent="selectFirstMatch(line)"
                        @keydown.escape="closeItemMenu(line)"
                        @blur="scheduleCloseItemMenu(line)"
                        :disabled="lineItemsLocked || !canCreateSales"
                      />
                      <div
                        v-if="isItemMenuOpen(line)"
                        class="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                      >
                        <div v-if="filteredItems(line).length === 0" class="px-3 py-2 text-xs text-slate-500">
                          {{ t('sales.options.noItemMatches') }}
                        </div>
                        <div v-else class="max-h-64 overflow-auto">
                          <button
                            v-for="item in filteredItems(line)"
                            :key="item.item_id"
                            type="button"
                            class="flex w-full flex-col gap-1 px-3 py-2 text-left text-sm hover:bg-slate-50"
                            @mousedown.prevent="selectItem(line, item)"
                          >
                            <span class="font-semibold text-slate-900">{{ itemLabel(item) }}</span>
                            <span class="text-xs text-slate-500">{{ formatCurrency(Number(item.price ?? 0)) }}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 pr-4 align-top">
                    <div
                      class="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
                    >
                      {{ lineUnit(line) }}
                    </div>
                  </td>
                  <td class="py-3 pr-4 text-right align-top">
                    <input
                      v-model.number="line.quantity"
                      type="number"
                      min="1"
                      class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-right"
                      :disabled="lineItemsLocked || !canCreateSales"
                    />
                  </td>
                  <td class="py-3 pr-4 text-right align-top">
                    <input
                      v-model.number="line.unit_price"
                      type="number"
                      min="0"
                      step="0.01"
                      class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-right"
                      :disabled="lineItemsLocked || !canCreateSales"
                    />
                  </td>
                  <td class="py-3 text-right align-top">
                    <div class="font-semibold text-slate-900">{{ formatCurrency(lineTotal(line)) }}</div>
                    <UButton
                      size="xs"
                      color="gray"
                      variant="outline"
                      class="mt-2"
                      :disabled="lineItemsLocked || !canCreateSales"
                      @click="removeLineItem(index)"
                    >
                      {{ t('sales.actions.removeLine') }}
                    </UButton>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div class="w-full md:max-w-md">
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('sales.summary.amountInWords') }}
                </label>
                <textarea
                  :value="amountInWords"
                  rows="3"
                  readonly
                  class="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                />
              </div>
              <div class="w-full max-w-xs space-y-2 text-sm text-slate-600">
                <div class="flex items-center justify-between gap-3">
                  <span class="font-semibold text-slate-500">{{ t('sales.summary.discount') }}</span>
                  <input
                    v-model.number="saleForm.discount_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-28 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm"
                    :disabled="!canCreateSales || !isDiscountEnabled || isEditLocked"
                  />
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="font-semibold text-slate-500">
                    {{ t('sales.summary.vat') }} ({{ vatRatePercent }}%)
                  </span>
                  <span class="font-semibold text-slate-900">{{ formatCurrency(vatAmount) }}</span>
                </div>
                <div class="flex items-center justify-between border-t border-slate-200 pt-2 text-base">
                  <span class="font-semibold text-slate-700">{{ t('sales.summary.totalWithVat') }}</span>
                  <span class="font-semibold text-slate-900">{{ formatCurrency(grandTotal) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label class="text-xs font-semibold uppercase text-slate-500">{{ t('sales.fields.notes') }}</label>
          <textarea
            v-model="saleForm.notes"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            rows="2"
            :disabled="!canCreateSales || isEditLocked"
          />
        </div>

        <div class="flex flex-wrap gap-3">
          <UButton
            type="submit"
            color="primary"
            :loading="isSubmitting"
            :disabled="isSubmitting || !canCreateSales || isEditLocked"
          >
            {{ t('sales.actions.save') }}
          </UButton>
          <UButton type="button" color="gray" variant="outline" @click="resetForm">
            {{ t('sales.actions.clear') }}
          </UButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { useSalesStore } from '~/stores/sales'
import { useSettingsStore } from '~/stores/settings'
import { createId } from '~/utils/id'
import type { Item, SaleAttachment, SaleItem } from '~/types/database'
import { usePermissions } from '~/composables/usePermissions'
import { useFlashMessage } from '~/composables/useFlashMessage'
import { useAuth } from '~/composables/useAuth'

type LineDraft = {
  tempId: string
  item_id: string
  line_type: SaleItem['line_type']
  quantity: number
  unit_price: number
  description: string
  item_query: string
}

const store = useSalesStore()
const inventoryStore = useInventoryStore()
const settingsStore = useSettingsStore()
const { can, loadPermissions } = usePermissions()
const { setFlashMessage } = useFlashMessage()
const router = useRouter()
const route = useRoute()
const { locale, t } = useI18n()
const localePath = useLocalePath()
const { user } = useAuth()

const saleForm = useState('sales-form', () => ({
  sale_type: 'RETAIL' as const,
  status: 'COMPLETED' as const,
  payment_status: 'PAID' as const,
  payment_method: '',
  receipt_number: '',
  performed_by: '',
  location_id: '',
  customer_id: '',
  customer_name: '',
  customer_phone: '',
  customer_tin: '',
  customer_vat_registration_no: '',
  discount_amount: 0,
  tax_amount: 0,
  notes: ''
}))

const lineItems = useState<LineDraft[]>('sales-line-items', () => [])
const saleAttachments = ref<
  Array<{
    temp_id: string
    file_name: string
    file_type: string
    file_size: number
    data_url: string
  }>
>([])
const attachmentErrors = ref<string[]>([])
const formMessage = ref<{ type: 'primary' | 'red'; text: string } | null>(null)
const { isSubmitting, runWithLock } = useSubmitLock()
const storageKeyForm = 'omega.sales.form'
const storageKeyLines = 'omega.sales.lines'
const maxItemMatches = 12
const activeLineId = ref<string | null>(null)

const editingSaleId = computed(() => (typeof route.query.sale === 'string' ? route.query.sale : ''))
const isEditing = computed(() => Boolean(editingSaleId.value))
const editingSale = computed(() => store.sales.find((entry) => entry.sale_id === editingSaleId.value))
const isAdmin = computed(() => user.value?.role === 'admin')
const defaultEmployeeName = computed(() => user.value?.name || user.value?.username || user.value?.email || '')
const isEditLocked = computed(() => isEditing.value && editingSale.value?.status === 'COMPLETED' && !isAdmin.value)
const lineItemsLocked = computed(() => isEditLocked.value)

watch(
  defaultEmployeeName,
  (value) => {
    if (!isEditing.value && !isAdmin.value) {
      saleForm.value.performed_by = value
      return
    }
    if (!saleForm.value.performed_by) {
      saleForm.value.performed_by = value
    }
  },
  { immediate: true }
)

const itemsById = computed(() => new Map(inventoryStore.items.map((entry) => [entry.item_id, entry])))

const itemLabel = (item: Item) => {
  const base = [item.name, item.model].filter(Boolean).join(' • ')
  const sku = item.sku ? ` (${item.sku})` : ''
  return `${base}${sku}`.trim()
}

const itemSearchText = (item: Item) => {
  return [item.name, item.model, item.sku, item.vendor_sku, item.barcode].filter(Boolean).join(' ').toLowerCase()
}

const sortedItems = computed(() => {
  return [...inventoryStore.items].sort((a, b) => itemLabel(a).localeCompare(itemLabel(b)))
})

const lineTotal = (line: LineDraft) => line.quantity * line.unit_price

const lineSubtotal = computed(() => lineItems.value.reduce((sum, line) => sum + lineTotal(line), 0))

const vatRate = computed(() => {
  const rate = Number(settingsStore.getSetting('tax_rate')?.setting_value ?? 0)
  return Number.isFinite(rate) ? rate : 0
})

const isDiscountEnabled = computed(
  () => settingsStore.getSetting('sales_discounts_enabled')?.setting_value === 'true'
)

const effectiveDiscount = computed(() => (isDiscountEnabled.value ? saleForm.value.discount_amount : 0))

const vatAmount = computed(() => {
  const taxable = Math.max(0, lineSubtotal.value - effectiveDiscount.value)
  return taxable * vatRate.value
})

const vatRatePercent = computed(() => {
  const percent = vatRate.value * 100
  if (!Number.isFinite(percent)) {
    return '0'
  }
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(2)
})

const grandTotal = computed(() => lineSubtotal.value - effectiveDiscount.value + vatAmount.value)

const amountInWords = computed(() => formatAmountInWords(grandTotal.value, locale.value))
const canViewSales = computed(() => can('sales.view'))
const canCreateSales = computed(() => can('sales.create'))

const formatAmountInWords = (amount: number, currentLocale: string) => {
  if (!Number.isFinite(amount)) {
    return ''
  }
  const useAmharic = currentLocale.toLowerCase().startsWith('am')
  const isNegative = amount < 0
  const absolute = Math.abs(amount)
  const integerPart = Math.floor(absolute)
  const cents = Math.round((absolute - integerPart) * 100)
  const words = integerPart === 0 ? (useAmharic ? 'ዜሮ' : 'zero') : numberToWords(integerPart, useAmharic)
  const centsPart = useAmharic
    ? cents > 0
      ? ` እና ${cents}/100 ሳንቲም`
      : ''
    : cents > 0
      ? ` and ${cents}/100`
      : ''
  const currencyLabel = useAmharic ? 'ብር' : 'birr'
  const prefix = isNegative ? (useAmharic ? 'መነሳ ' : 'minus ') : ''
  return `${prefix}${words} ${currencyLabel}${centsPart}`.trim()
}

const numberToWords = (value: number, useAmharic: boolean) => {
  if (useAmharic) {
    return numberToWordsAmharic(value)
  }
  const ones = [
    '',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine'
  ]
  const teens = [
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen'
  ]
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
  const scales = ['', 'thousand', 'million', 'billion', 'trillion']

  const chunkToWords = (num: number) => {
    const parts: string[] = []
    const hundreds = Math.floor(num / 100)
    const remainder = num % 100

    if (hundreds) {
      parts.push(`${ones[hundreds]} hundred`)
    }
    if (remainder >= 20) {
      const tensDigit = Math.floor(remainder / 10)
      const onesDigit = remainder % 10
      parts.push(tens[tensDigit])
      if (onesDigit) {
        parts.push(ones[onesDigit])
      }
    } else if (remainder >= 10) {
      parts.push(teens[remainder - 10])
    } else if (remainder > 0) {
      parts.push(ones[remainder])
    }

    return parts.join(' ')
  }

  if (value === 0) {
    return 'zero'
  }

  let remaining = value
  let scaleIndex = 0
  const words: string[] = []

  while (remaining > 0) {
    const chunk = remaining % 1000
    if (chunk) {
      const chunkWords = chunkToWords(chunk)
      const scale = scales[scaleIndex]
      words.unshift(scale ? `${chunkWords} ${scale}` : chunkWords)
    }
    remaining = Math.floor(remaining / 1000)
    scaleIndex += 1
  }

  return words.join(' ').trim()
}

const numberToWordsAmharic = (value: number) => {
  const ones = [
    '',
    'አንድ',
    'ሁለት',
    'ሶስት',
    'አራት',
    'አምስት',
    'ስድስት',
    'ሰባት',
    'ስምንት',
    'ዘጠኝ'
  ]
  const teens = [
    'አስር',
    'አስራ አንድ',
    'አስራ ሁለት',
    'አስራ ሶስት',
    'አስራ አራት',
    'አስራ አምስት',
    'አስራ ስድስት',
    'አስራ ሰባት',
    'አስራ ስምንት',
    'አስራ ዘጠኝ'
  ]
  const tens = ['', '', 'ሃያ', 'ሰላሳ', 'አርባ', 'ሃምሳ', 'ስድሳ', 'ሰባ', 'ሰማንያ', 'ዘጠና']
  const scales = ['', 'ሺ', 'ሚሊዮን', 'ቢሊዮን', 'ትሪሊዮን']

  const chunkToWords = (num: number) => {
    const parts: string[] = []
    const hundreds = Math.floor(num / 100)
    const remainder = num % 100

    if (hundreds) {
      parts.push(`${ones[hundreds]} መቶ`)
    }
    if (remainder >= 20) {
      const tensDigit = Math.floor(remainder / 10)
      const onesDigit = remainder % 10
      parts.push(tens[tensDigit])
      if (onesDigit) {
        parts.push(ones[onesDigit])
      }
    } else if (remainder >= 10) {
      parts.push(teens[remainder - 10])
    } else if (remainder > 0) {
      parts.push(ones[remainder])
    }

    return parts.join(' ')
  }

  if (value === 0) {
    return 'ዜሮ'
  }

  let remaining = value
  let scaleIndex = 0
  const words: string[] = []

  while (remaining > 0) {
    const chunk = remaining % 1000
    if (chunk) {
      const chunkWords = chunkToWords(chunk)
      const scale = scales[scaleIndex]
      words.unshift(scale ? `${chunkWords} ${scale}` : chunkWords)
    }
    remaining = Math.floor(remaining / 1000)
    scaleIndex += 1
  }

  return words.join(' ').trim()
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'ETB' }).format(value || 0)
}

const supplierMeta = computed(() => {
  const businessName = settingsStore.getSetting('business_name')?.setting_value || 'Omega Electronics PLC'
  const tin = settingsStore.getSetting('supplier_tin')?.setting_value || null
  const vatDate = settingsStore.getSetting('vat_registration_date')?.setting_value || null
  const vatNumber = settingsStore.getSetting('vat_registration_no')?.setting_value || null
  const mainLocationId = settingsStore.getSetting('app_location_id')?.setting_value || ''
  const mainLocation =
    inventoryStore.locations.find((entry) => entry.location_id === mainLocationId) ??
    inventoryStore.locations.find((entry) => entry.location_id === saleForm.value.location_id)

  return {
    supplier_name: businessName,
    supplier_tin: tin,
    vat_registration_date: vatDate,
    supplier_vat_registration_no: vatNumber,
    supplier_address_sub_city: mainLocation?.sub_city ?? null,
    supplier_address_house_no: mainLocation?.house_no ?? null,
    supplier_address_city: mainLocation?.city ?? null,
    supplier_address_country: mainLocation?.country ?? null,
    supplier_address_po_box: mainLocation?.po_box ?? null
  }
})

const addLineItem = () => {
  lineItems.value.push({
    tempId: createId(),
    item_id: '',
    line_type: 'PRODUCT',
    quantity: 1,
    unit_price: 0,
    description: '',
    item_query: ''
  })
}

const removeLineItem = (index: number) => {
  lineItems.value.splice(index, 1)
}

const setItemDetails = (line: LineDraft) => {
  const item = inventoryStore.items.find((entry) => entry.item_id === line.item_id)
  if (!item) {
    line.description = ''
    line.line_type = 'PRODUCT'
    line.unit_price = 0
    return
  }
  line.description = item.name
  line.unit_price = item.price
  line.line_type = item.item_type === 'SPARE_PART' ? 'SPARE_PART' : 'PRODUCT'
  line.item_query = itemLabel(item)
}

const lineUnit = (line: LineDraft) => {
  if (!line.item_id) {
    return '-'
  }
  const item = itemsById.value.get(line.item_id)
  return item?.unit || '-'
}

const filteredItems = (line: LineDraft) => {
  const query = line.item_query?.trim().toLowerCase() ?? ''
  if (!query) {
    return sortedItems.value.slice(0, maxItemMatches)
  }
  return sortedItems.value.filter((item) => itemSearchText(item).includes(query)).slice(0, maxItemMatches)
}

const isItemMenuOpen = (line: LineDraft) => activeLineId.value === line.tempId

const openItemMenu = (line: LineDraft) => {
  activeLineId.value = line.tempId
}

const closeItemMenu = (line?: LineDraft) => {
  if (!line || activeLineId.value === line.tempId) {
    activeLineId.value = null
  }
}

const scheduleCloseItemMenu = (line: LineDraft) => {
  if (!process.client) {
    return
  }
  window.setTimeout(() => {
    if (activeLineId.value === line.tempId) {
      activeLineId.value = null
    }
  }, 150)
}

const handleItemInput = (line: LineDraft) => {
  openItemMenu(line)
  const query = line.item_query.trim()
  if (!query) {
    line.item_id = ''
    line.description = ''
    line.line_type = 'PRODUCT'
    line.unit_price = 0
    return
  }
  const item = line.item_id ? itemsById.value.get(line.item_id) : null
  if (item && itemLabel(item).toLowerCase() !== query.toLowerCase()) {
    line.item_id = ''
    line.description = ''
    line.line_type = 'PRODUCT'
    line.unit_price = 0
  }
}

const selectItem = (line: LineDraft, item: Item) => {
  line.item_id = item.item_id
  line.item_query = itemLabel(item)
  setItemDetails(line)
  activeLineId.value = null
}

const selectFirstMatch = (line: LineDraft) => {
  if (!line.item_query.trim()) {
    return
  }
  const matches = filteredItems(line)
  if (matches.length > 0) {
    selectItem(line, matches[0])
  }
}

const syncLineItemQuery = (line: LineDraft) => {
  if (!line.item_id) {
    return
  }
  const item = itemsById.value.get(line.item_id)
  if (!item) {
    return
  }
  const label = itemLabel(item)
  if (!line.item_query || line.item_query.toLowerCase() !== label.toLowerCase()) {
    line.item_query = label
  }
}

const resetForm = () => {
  saleForm.value.sale_type = 'RETAIL'
  saleForm.value.status = 'COMPLETED'
  saleForm.value.payment_status = 'PAID'
  saleForm.value.payment_method = ''
  saleForm.value.receipt_number = ''
  saleForm.value.performed_by = defaultEmployeeName.value
  saleForm.value.location_id = ''
  saleForm.value.customer_id = ''
  saleForm.value.customer_name = ''
  saleForm.value.customer_phone = ''
  saleForm.value.customer_tin = ''
  saleForm.value.customer_vat_registration_no = ''
  saleForm.value.discount_amount = 0
  saleForm.value.tax_amount = 0
  saleForm.value.notes = ''
  lineItems.value = []
  saleAttachments.value = []
  attachmentErrors.value = []
  formMessage.value = null
  if (process.client) {
    localStorage.removeItem(storageKeyForm)
    localStorage.removeItem(storageKeyLines)
  }
}

const loadSaleForEdit = () => {
  const sale = editingSale.value
  if (!sale) {
    return
  }
  saleForm.value.sale_type = sale.sale_type
  saleForm.value.status = sale.status
  saleForm.value.payment_status = sale.payment_status
  saleForm.value.payment_method = sale.payment_method ?? ''
  saleForm.value.receipt_number = sale.receipt_number ?? ''
  saleForm.value.performed_by = sale.performed_by ?? ''
  saleForm.value.location_id = sale.location_id
  saleForm.value.customer_id = sale.customer_id ?? ''
  saleForm.value.customer_name = sale.customer_name ?? ''
  saleForm.value.customer_phone = sale.customer_phone ?? ''
  saleForm.value.customer_tin = sale.customer_tin ?? ''
  saleForm.value.customer_vat_registration_no = sale.customer_vat_registration_no ?? ''
  saleForm.value.discount_amount = Number(sale.discount_amount ?? 0)
  saleForm.value.tax_amount = Number(sale.tax_amount ?? 0)
  saleForm.value.notes = sale.notes ?? ''

  lineItems.value = store.saleItems
    .filter((entry) => entry.sale_id === sale.sale_id)
    .map((entry) => ({
      tempId: entry.sale_item_id,
      item_id: entry.item_id ?? '',
      line_type: entry.line_type,
      quantity: entry.quantity,
      unit_price: entry.unit_price,
      description: entry.description ?? '',
      item_query: ''
    }))
  lineItems.value.forEach(syncLineItemQuery)
  saleAttachments.value = []
  attachmentErrors.value = []
  formMessage.value = null
}

const handleAttachmentSelect = async (event: Event) => {
  // TODO: Replace data URL storage with Supabase Storage uploads before production.
  const input = event.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  attachmentErrors.value = []

  if (!files.length) {
    return
  }

  const nextAttachments: typeof saleAttachments.value = []

  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      attachmentErrors.value.push(t('sales.messages.attachmentTooLarge', { name: file.name }))
      continue
    }
    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
    nextAttachments.push({
      temp_id: createId(),
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      data_url: dataUrl
    })
  }

  if (nextAttachments.length) {
    saleAttachments.value = [...saleAttachments.value, ...nextAttachments]
  }

  input.value = ''
}

const removeAttachment = (tempId: string) => {
  saleAttachments.value = saleAttachments.value.filter((entry) => entry.temp_id !== tempId)
}

const handleSubmit = async () => {
  await runWithLock(async () => {
    formMessage.value = null

    if (isEditLocked.value) {
      formMessage.value = { type: 'red', text: t('sales.messages.locked') }
      return
    }
    if (!saleForm.value.receipt_number.trim()) {
      formMessage.value = { type: 'red', text: t('sales.messages.receiptRequired') }
      return
    }
    if (!saleForm.value.performed_by?.trim()) {
      formMessage.value = { type: 'red', text: t('sales.messages.employeeRequired') }
      return
    }
    if (!saleForm.value.payment_method) {
      formMessage.value = { type: 'red', text: t('sales.messages.paymentMethodRequired') }
      return
    }
    if (!saleForm.value.location_id) {
      formMessage.value = { type: 'red', text: t('sales.messages.locationRequired') }
      return
    }
    if (lineItems.value.length === 0) {
      formMessage.value = { type: 'red', text: t('sales.messages.lineRequired') }
      return
    }
    if (!isDiscountEnabled.value && saleForm.value.discount_amount > 0) {
      formMessage.value = { type: 'red', text: t('sales.messages.discountNotAllowed') }
      return
    }

    const normalizedItems: SaleItem[] = lineItems.value.map((line) => ({
      sale_item_id: line.tempId,
      sale_id: '',
      item_id: line.item_id || null,
      description: line.description || null,
      line_type: line.line_type,
      quantity: line.quantity,
      unit_price: line.unit_price,
      discount_amount: 0,
      tax_amount: 0,
      line_total: lineTotal(line),
      affects_inventory: ['PRODUCT', 'SPARE_PART'].includes(line.line_type) && Boolean(line.item_id)
    }))

    try {
      const attachmentsPayload: SaleAttachment[] = saleAttachments.value.map((attachment) => ({
        attachment_id: '',
        sale_id: '',
        file_name: attachment.file_name,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
        data_url: attachment.data_url
      }))

      const salePayload = {
        sale_id: isEditing.value ? editingSaleId.value : undefined,
        sale_type: saleForm.value.sale_type,
        status: saleForm.value.status,
        payment_status: saleForm.value.payment_status,
        payment_method: saleForm.value.payment_method,
        receipt_number: saleForm.value.receipt_number.trim(),
        performed_by: saleForm.value.performed_by?.trim() || null,
        customer_id: saleForm.value.customer_id || null,
        customer_name: saleForm.value.customer_name || null,
        customer_phone: saleForm.value.customer_phone || null,
        customer_tin: saleForm.value.customer_tin || null,
        customer_vat_registration_no: saleForm.value.customer_vat_registration_no || null,
        ...supplierMeta.value,
        discount_amount: effectiveDiscount.value,
        tax_amount: vatAmount.value,
        subtotal_amount: lineSubtotal.value,
        total_amount: grandTotal.value,
        is_repair_service: false,
        location_id: saleForm.value.location_id,
        notes: saleForm.value.notes
      }

      if (isEditing.value) {
        await store.updateSale(editingSaleId.value, salePayload, normalizedItems, attachmentsPayload)
      } else {
        await store.createSale(salePayload, normalizedItems, attachmentsPayload)
      }
    } catch (error: any) {
      const statusMessage = error?.data?.statusMessage || error?.message
      if (statusMessage === 'INSUFFICIENT_STOCK') {
        formMessage.value = { type: 'red', text: t('sales.messages.insufficientStock') }
        return
      }
      if (statusMessage === 'SALE_LOCKED') {
        formMessage.value = { type: 'red', text: t('sales.messages.locked') }
        return
      }
      if (statusMessage === 'LINE_ITEMS_LOCKED') {
        formMessage.value = { type: 'red', text: t('sales.messages.lineItemsLocked') }
        return
      }
      if (statusMessage === 'RECEIPT_NUMBER_REQUIRED') {
        formMessage.value = { type: 'red', text: t('sales.messages.receiptRequired') }
        return
      }
      if (statusMessage === 'PAYMENT_METHOD_REQUIRED') {
        formMessage.value = { type: 'red', text: t('sales.messages.paymentMethodRequired') }
        return
      }
      if (statusMessage === 'ATTACHMENT_TOO_LARGE') {
        formMessage.value = { type: 'red', text: t('sales.messages.attachmentTooLarge', { name: '' }) }
        return
      }
      throw error
    }

    setFlashMessage({ type: 'primary', text: isEditing.value ? t('sales.messages.updated') : t('sales.messages.saved') })
    resetForm()
    await router.push(localePath('/sales'))
  })
}

onMounted(async () => {
  await loadPermissions()
  if (!inventoryStore.isLoaded) {
    await inventoryStore.loadAll()
  }
  if (!settingsStore.isLoaded) {
    await settingsStore.loadAll()
  }
  if (!store.isLoaded) {
    await store.loadAll()
  }

  if (isEditing.value) {
    loadSaleForEdit()
  } else {
    if (lineItems.value.length === 0) {
      addLineItem()
    }
    if (process.client) {
      try {
        const storedForm = localStorage.getItem(storageKeyForm)
        if (storedForm) {
          saleForm.value = { ...saleForm.value, ...JSON.parse(storedForm) }
        }
        const storedLines = localStorage.getItem(storageKeyLines)
        if (storedLines) {
          const parsed = JSON.parse(storedLines)
          if (Array.isArray(parsed)) {
            lineItems.value = parsed.map((line) => ({
              tempId: line.tempId || createId(),
              item_id: line.item_id || '',
              line_type: line.line_type || 'PRODUCT',
              quantity: Number.isFinite(line.quantity) ? line.quantity : 1,
              unit_price: Number.isFinite(line.unit_price) ? line.unit_price : 0,
              description: line.description || '',
              item_query: typeof line.item_query === 'string' ? line.item_query : ''
            }))
          }
        }
      } catch (error) {
        console.warn('Failed to restore sales draft', error)
      }
    }
    if (!isAdmin.value) {
      saleForm.value.performed_by = defaultEmployeeName.value
    }
    lineItems.value.forEach(syncLineItemQuery)
  }
})

watch(
  saleForm,
  (value) => {
    if (!process.client || isEditing.value) {
      return
    }
    try {
      localStorage.setItem(storageKeyForm, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to persist sales form', error)
    }
  },
  { deep: true }
)

watch(
  lineItems,
  (value) => {
    if (!process.client || isEditing.value) {
      return
    }
    try {
      localStorage.setItem(storageKeyLines, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to persist sales lines', error)
    }
  },
  { deep: true }
)

watch(isDiscountEnabled, (enabled) => {
  if (!enabled) {
    saleForm.value.discount_amount = 0
  }
})

watch(editingSaleId, (value) => {
  if (value) {
    loadSaleForEdit()
  }
})
</script>
