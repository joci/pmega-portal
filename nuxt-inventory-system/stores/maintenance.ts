import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDatabase } from '~/composables/useDatabase'
import { createId } from '~/utils/id'
import type { Customer, CustomerDevice, MaintenanceTicket, PartRequest, PartUsage } from '~/types/database'

const nowIso = () => new Date().toISOString()

export type TicketInput = Omit<MaintenanceTicket, 'ticket_id' | 'created_at' | 'updated_at' | 'sync_status'> & {
  ticket_id?: string
}

export const useMaintenanceStore = defineStore('maintenance', () => {
  const tickets = ref<MaintenanceTicket[]>([])
  const partRequests = ref<PartRequest[]>([])
  const partUsage = ref<PartUsage[]>([])
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
    const [ticketRows, requestRows, usageRows, customerRows, deviceRows] = await Promise.all([
      db.maintenanceTickets.toArray(),
      db.partRequests.toArray(),
      db.partUsage.toArray(),
      db.customers.toArray(),
      db.customerDevices.toArray()
    ])

    tickets.value = ticketRows
    partRequests.value = requestRows
    partUsage.value = usageRows
    customers.value = customerRows
    customerDevices.value = deviceRows
    isLoaded.value = true
  }

  const createTicket = async (payload: TicketInput) => {
    const db = getDb()
    const ticketId = payload.ticket_id ?? createId()
    const ticket: MaintenanceTicket = {
      ...payload,
      ticket_id: ticketId,
      created_at: nowIso(),
      updated_at: nowIso(),
      sync_status: 'SYNCED'
    }

    await db.maintenanceTickets.add(ticket)
    tickets.value = [ticket, ...tickets.value]
  }

  const createCustomer = async (payload: Omit<Customer, 'customer_id' | 'created_at' | 'updated_at' | 'sync_status'>) => {
    const db = getDb()
    const customer: Customer = {
      ...payload,
      customer_id: createId(),
      created_at: nowIso(),
      updated_at: nowIso(),
      sync_status: 'SYNCED'
    }
    await db.customers.add(customer)
    customers.value = [customer, ...customers.value]
    return customer.customer_id
  }

  const createCustomerDevice = async (
    payload: Omit<CustomerDevice, 'device_id' | 'created_at' | 'updated_at' | 'sync_status'>
  ) => {
    const db = getDb()
    const device: CustomerDevice = {
      ...payload,
      device_id: createId(),
      created_at: nowIso(),
      updated_at: nowIso(),
      sync_status: 'SYNCED'
    }
    await db.customerDevices.add(device)
    customerDevices.value = [device, ...customerDevices.value]
    return device.device_id
  }

  return {
    tickets,
    partRequests,
    partUsage,
    customers,
    customerDevices,
    isLoaded,
    loadAll,
    createTicket,
    createCustomer,
    createCustomerDevice
  }
})
