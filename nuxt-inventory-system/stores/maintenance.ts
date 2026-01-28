import { defineStore } from 'pinia'
import { $fetch, FetchError } from 'ofetch'
import { ref } from 'vue'
import { useDatabase } from '~/composables/useDatabase'
import { useInventoryStore } from '~/stores/inventory'
import type {
  Customer,
  CustomerDevice,
  MaintenanceAttachment,
  MaintenanceTicket,
  PartRequest,
  PartUsage
} from '~/types/database'

export type TicketInput = Omit<MaintenanceTicket, 'ticket_id' | 'created_at' | 'updated_at' | 'sync_status'> & {
  ticket_id?: string
}

export const useMaintenanceStore = defineStore('maintenance', () => {
  const tickets = ref<MaintenanceTicket[]>([])
  const partRequests = ref<PartRequest[]>([])
  const partUsage = ref<PartUsage[]>([])
  const attachments = ref<MaintenanceAttachment[]>([])
  const customers = ref<Customer[]>([])
  const customerDevices = ref<CustomerDevice[]>([])
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
        tickets: MaintenanceTicket[]
        partRequests: PartRequest[]
        partUsage: PartUsage[]
        attachments: MaintenanceAttachment[]
        customers: Customer[]
        customerDevices: CustomerDevice[]
      }>('/api/maintenance')

      tickets.value = payload.tickets
      partRequests.value = payload.partRequests
      partUsage.value = payload.partUsage
      attachments.value = payload.attachments
      customers.value = payload.customers
      customerDevices.value = payload.customerDevices
      isLoaded.value = true

      await db.transaction(
        'rw',
        db.maintenanceTickets,
        db.partRequests,
        db.partUsage,
        db.maintenanceAttachments,
        db.customers,
        db.customerDevices,
        async () => {
          await db.maintenanceTickets.clear()
          await db.partRequests.clear()
          await db.partUsage.clear()
          await db.maintenanceAttachments.clear()
          await db.customers.clear()
          await db.customerDevices.clear()

          await db.maintenanceTickets.bulkAdd(payload.tickets)
          await db.partRequests.bulkAdd(payload.partRequests)
          await db.partUsage.bulkAdd(payload.partUsage)
          await db.maintenanceAttachments.bulkAdd(payload.attachments)
          await db.customers.bulkAdd(payload.customers)
          await db.customerDevices.bulkAdd(payload.customerDevices)
        }
      )
      return
    } catch (error) {
      console.warn('Failed to load maintenance from server, falling back to cache.', error)
    }

    const [ticketRows, requestRows, usageRows, attachmentRows, customerRows, deviceRows] = await Promise.all([
      db.maintenanceTickets.toArray(),
      db.partRequests.toArray(),
      db.partUsage.toArray(),
      db.maintenanceAttachments.toArray(),
      db.customers.toArray(),
      db.customerDevices.toArray()
    ])

    tickets.value = ticketRows
    partRequests.value = requestRows
    partUsage.value = usageRows
    attachments.value = attachmentRows
    customers.value = customerRows
    customerDevices.value = deviceRows
    isLoaded.value = true
  }

  const createTicket = async (payload: TicketInput, attachmentsPayload: MaintenanceAttachment[] = []) => {
    const db = getDb()
    const response = await $fetch<{ ticket: MaintenanceTicket; attachments: MaintenanceAttachment[] }>(
      '/api/maintenance/tickets',
      {
        method: 'POST',
        body: { ...payload, attachments: attachmentsPayload }
      }
    )

    tickets.value = [response.ticket, ...tickets.value]
    attachments.value = [...response.attachments, ...attachments.value]
    await db.maintenanceTickets.put(response.ticket)
    if (response.attachments.length > 0) {
      await db.maintenanceAttachments.bulkPut(response.attachments)
    }
  }

  const updateTicket = async (payload: MaintenanceTicket, attachmentsPayload: MaintenanceAttachment[] = []) => {
    const db = getDb()
    const response = await $fetch<{ ticket: MaintenanceTicket; attachments: MaintenanceAttachment[] }>(
      `/api/maintenance/tickets/${payload.ticket_id}`,
      {
        method: 'PUT',
        body: { ...payload, attachments: attachmentsPayload }
      }
    )

    tickets.value = tickets.value.map((entry) =>
      entry.ticket_id === response.ticket.ticket_id ? response.ticket : entry
    )
    attachments.value = [
      ...attachments.value.filter((entry) => entry.ticket_id !== response.ticket.ticket_id),
      ...response.attachments
    ]
    await db.maintenanceTickets.put(response.ticket)
    if (response.attachments.length > 0) {
      await db.maintenanceAttachments.bulkPut(response.attachments)
    }
  }

  const createCustomer = async (payload: Omit<Customer, 'customer_id' | 'created_at' | 'updated_at' | 'sync_status'>) => {
    const db = getDb()
    const customer = await $fetch<Customer>('/api/maintenance/customers', {
      method: 'POST',
      body: payload
    })
    customers.value = [customer, ...customers.value]
    await db.customers.put(customer)
    return customer.customer_id
  }

  const updateCustomer = async (payload: Customer) => {
    const db = getDb()
    const updated = await $fetch<Customer>(`/api/maintenance/customers/${payload.customer_id}`, {
      method: 'PUT',
      body: payload
    })
    customers.value = customers.value.map((entry) =>
      entry.customer_id === updated.customer_id ? updated : entry
    )
    await db.customers.put(updated)
  }

  const createCustomerDevice = async (
    payload: Omit<CustomerDevice, 'device_id' | 'created_at' | 'updated_at' | 'sync_status'>
  ) => {
    const db = getDb()
    const device = await $fetch<CustomerDevice>('/api/maintenance/devices', {
      method: 'POST',
      body: payload
    })
    customerDevices.value = [device, ...customerDevices.value]
    await db.customerDevices.put(device)
    return device.device_id
  }

  const updateCustomerDevice = async (payload: CustomerDevice) => {
    const db = getDb()
    const updated = await $fetch<CustomerDevice>(`/api/maintenance/devices/${payload.device_id}`, {
      method: 'PUT',
      body: payload
    })
    customerDevices.value = customerDevices.value.map((entry) =>
      entry.device_id === updated.device_id ? updated : entry
    )
    await db.customerDevices.put(updated)
  }

  const createPartRequest = async (
    payload: Omit<PartRequest, 'request_id' | 'created_at' | 'updated_at' | 'sync_status'>
  ) => {
    const db = getDb()
    let request: PartRequest
    try {
      request = await $fetch<PartRequest>('/api/maintenance/part-requests', {
        method: 'POST',
        body: payload
      })
    } catch (error) {
      if (error instanceof FetchError && error.data?.statusMessage === 'INSUFFICIENT_STOCK') {
        throw new Error('INSUFFICIENT_STOCK')
      }
      throw error
    }

    partRequests.value = [request, ...partRequests.value]
    await db.partRequests.put(request)
    if (request.status === 'APPROVED' && request.source_preference === 'STORE_INVENTORY') {
      const inventoryStore = useInventoryStore()
      if (inventoryStore.isLoaded) {
        await inventoryStore.loadAll()
      }
    }
    return request.request_id
  }

  const createPartUsage = async (payload: Omit<PartUsage, 'usage_id' | 'sync_status'>) => {
    const db = getDb()
    const usage = await $fetch<PartUsage>('/api/maintenance/part-usage', {
      method: 'POST',
      body: payload
    })

    partUsage.value = [usage, ...partUsage.value]
    await db.partUsage.put(usage)
    return usage.usage_id
  }

  const updatePartRequest = async (payload: PartRequest) => {
    const db = getDb()
    let updated: PartRequest
    try {
      updated = await $fetch<PartRequest>(`/api/maintenance/part-requests/${payload.request_id}`, {
        method: 'PUT',
        body: payload
      })
    } catch (error) {
      if (error instanceof FetchError && error.data?.statusMessage === 'INSUFFICIENT_STOCK') {
        throw new Error('INSUFFICIENT_STOCK')
      }
      throw error
    }

    partRequests.value = partRequests.value.map((entry) =>
      entry.request_id === updated.request_id ? updated : entry
    )
    await db.partRequests.put(updated)
    if (updated.source_preference === 'STORE_INVENTORY') {
      const inventoryStore = useInventoryStore()
      if (inventoryStore.isLoaded) {
        await inventoryStore.loadAll()
      }
    }
  }

  const deletePartRequest = async (requestId: string) => {
    const db = getDb()
    await $fetch(`/api/maintenance/part-requests/${requestId}`, { method: 'DELETE' })
    partRequests.value = partRequests.value.filter((entry) => entry.request_id !== requestId)
    await db.partRequests.delete(requestId)
  }

  const updatePartUsage = async (payload: PartUsage) => {
    const db = getDb()
    const updated = await $fetch<PartUsage>(`/api/maintenance/part-usage/${payload.usage_id}`, {
      method: 'PUT',
      body: payload
    })

    partUsage.value = partUsage.value.map((entry) =>
      entry.usage_id === updated.usage_id ? updated : entry
    )
    await db.partUsage.put(updated)
  }

  const deleteAttachment = async (attachmentId: string) => {
    const db = getDb()
    await $fetch(`/api/maintenance/attachments/${attachmentId}`, {
      method: 'DELETE'
    })
    attachments.value = attachments.value.filter((entry) => entry.attachment_id !== attachmentId)
    await db.maintenanceAttachments.delete(attachmentId)
  }

  const reset = () => {
    tickets.value = []
    partRequests.value = []
    partUsage.value = []
    attachments.value = []
    customers.value = []
    customerDevices.value = []
    isLoaded.value = false
  }

  return {
    tickets,
    partRequests,
    partUsage,
    customers,
    customerDevices,
    attachments,
    isLoaded,
    loadAll,
    createTicket,
    updateTicket,
    createCustomer,
    updateCustomer,
    createCustomerDevice,
    updateCustomerDevice,
    createPartRequest,
    createPartUsage,
    updatePartRequest,
    updatePartUsage,
    deletePartRequest,
    deleteAttachment,
    reset
  }
})
