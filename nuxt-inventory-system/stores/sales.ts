import { defineStore } from 'pinia'
import { $fetch, FetchError } from 'ofetch'
import { ref } from 'vue'
import { useDatabase } from '~/composables/useDatabase'
import { useInventoryStore } from '~/stores/inventory'
import type { Payment, Sale, SaleAttachment, SaleItem } from '~/types/database'

export type SaleInput = Omit<Sale, 'sale_id' | 'created_at' | 'updated_at' | 'sync_status'> & {
  sale_id?: string
}

export const useSalesStore = defineStore('sales', () => {
  const sales = ref<Sale[]>([])
  const saleItems = ref<SaleItem[]>([])
  const payments = ref<Payment[]>([])
  const attachments = ref<SaleAttachment[]>([])
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
    try {
      const payload = await $fetch<{
        sales: Sale[]
        saleItems: SaleItem[]
        payments: Payment[]
        attachments: SaleAttachment[]
      }>('/api/sales')

      sales.value = payload.sales
      saleItems.value = payload.saleItems
      payments.value = payload.payments
      attachments.value = payload.attachments
      isLoaded.value = true

      await db.transaction('rw', db.sales, db.saleItems, db.payments, db.saleAttachments, async () => {
        await db.sales.clear()
        await db.saleItems.clear()
        await db.payments.clear()
        await db.saleAttachments.clear()
        await db.sales.bulkAdd(payload.sales)
        await db.saleItems.bulkAdd(payload.saleItems)
        await db.payments.bulkAdd(payload.payments)
        await db.saleAttachments.bulkAdd(payload.attachments)
      })
      return
    } catch (error) {
      console.warn('Failed to load sales from server, falling back to cache.', error)
    }

    const [saleRows, itemRows, paymentRows, attachmentRows] = await Promise.all([
      db.sales.toArray(),
      db.saleItems.toArray(),
      db.payments.toArray(),
      db.saleAttachments.toArray()
    ])

    sales.value = saleRows
    saleItems.value = itemRows
    payments.value = paymentRows
    attachments.value = attachmentRows
    isLoaded.value = true
  }

  const createSale = async (payload: SaleInput, items: SaleItem[], attachmentsPayload: SaleAttachment[] = []) => {
    const db = getDb()
    try {
      const response = await $fetch<{ sale: Sale; items: SaleItem[]; attachments: SaleAttachment[] }>('/api/sales', {
        method: 'POST',
        body: { sale: payload, items, attachments: attachmentsPayload }
      })

      sales.value = [response.sale, ...sales.value]
      saleItems.value = [...response.items, ...saleItems.value]
      attachments.value = [...response.attachments, ...attachments.value]
      await db.sales.put(response.sale)
      if (response.items.length > 0) {
        await db.saleItems.bulkPut(response.items)
      }
      if (response.attachments.length > 0) {
        await db.saleAttachments.bulkPut(response.attachments)
      }
      const inventoryStore = useInventoryStore()
      if (inventoryStore.isLoaded) {
        await inventoryStore.loadAll()
      }
    } catch (error) {
      if (error instanceof FetchError && error.data?.statusMessage === 'INSUFFICIENT_STOCK') {
        throw new Error('INSUFFICIENT_STOCK')
      }
      throw error
    }
  }

  return {
    sales,
    saleItems,
    payments,
    attachments,
    isLoaded,
    loadAll,
    createSale
  }
})
