import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDatabase } from '~/composables/useDatabase'
import { createId } from '~/utils/id'
import type { Payment, Sale, SaleItem } from '~/types/database'

const nowIso = () => new Date().toISOString()

export type SaleInput = Omit<Sale, 'sale_id' | 'created_at' | 'updated_at' | 'sync_status'> & {
  sale_id?: string
}

export const useSalesStore = defineStore('sales', () => {
  const sales = ref<Sale[]>([])
  const saleItems = ref<SaleItem[]>([])
  const payments = ref<Payment[]>([])
  const isLoaded = ref(false)

  const getDb = () => {
    const db = useDatabase()
    if (!db) {
      throw new Error('Database is only available on the client')
    }

    return db
  }

  const loadAll = async () => {
    const db = getDb()
    const [saleRows, itemRows, paymentRows] = await Promise.all([
      db.sales.toArray(),
      db.saleItems.toArray(),
      db.payments.toArray()
    ])

    sales.value = saleRows
    saleItems.value = itemRows
    payments.value = paymentRows
    isLoaded.value = true
  }

  const createSale = async (payload: SaleInput, items: SaleItem[]) => {
    const db = getDb()
    const saleId = payload.sale_id ?? createId()
    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0)
    const discount = payload.discount_amount ?? 0
    const tax = payload.tax_amount ?? 0
    const total = subtotal - discount + tax

    const sale: Sale = {
      ...payload,
      sale_id: saleId,
      sale_date: payload.sale_date ?? nowIso(),
      subtotal_amount: subtotal,
      discount_amount: discount,
      tax_amount: tax,
      total_amount: total,
      created_at: nowIso(),
      updated_at: nowIso(),
      sync_status: 'SYNCED'
    }

    const saleLineItems = items.map((entry) => ({
      ...entry,
      sale_item_id: entry.sale_item_id || createId(),
      sale_id: saleId,
      created_at: nowIso(),
      updated_at: nowIso(),
      sync_status: 'SYNCED'
    }))

    await db.sales.add(sale)
    if (saleLineItems.length > 0) {
      await db.saleItems.bulkAdd(saleLineItems)
    }

    sales.value = [sale, ...sales.value]
    saleItems.value = [...saleLineItems, ...saleItems.value]
  }

  return {
    sales,
    saleItems,
    payments,
    isLoaded,
    loadAll,
    createSale
  }
})
