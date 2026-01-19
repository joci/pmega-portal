import Dexie from 'dexie'
import type { Table } from 'dexie'
import type {
  Category,
  Customer,
  CustomerDevice,
  Inventory,
  Item,
  ItemAttachment,
  Location,
  MaintenanceTicket,
  PartRequest,
  PartUsage,
  Payment,
  Sale,
  SaleItem,
  Setting
} from '~/types/database'

export class OmegaDatabase extends Dexie {
  items!: Table<Item, 'item_id'>
  categories!: Table<Category, 'category_id'>
  locations!: Table<Location, 'location_id'>
  inventory!: Table<Inventory, 'inventory_id'>
  attachments!: Table<ItemAttachment, 'attachment_id'>
  customers!: Table<Customer, 'customer_id'>
  customerDevices!: Table<CustomerDevice, 'device_id'>
  sales!: Table<Sale, 'sale_id'>
  saleItems!: Table<SaleItem, 'sale_item_id'>
  payments!: Table<Payment, 'payment_id'>
  maintenanceTickets!: Table<MaintenanceTicket, 'ticket_id'>
  partRequests!: Table<PartRequest, 'request_id'>
  partUsage!: Table<PartUsage, 'usage_id'>
  settings!: Table<Setting, 'setting_id'>

  constructor() {
    super('omega_inventory')

    const baseSchema = {
      items: 'item_id, name, category_id, item_type, sku',
      categories: 'category_id, name, category_type',
      locations: 'location_id, name, location_type',
      inventory: 'inventory_id, item_id, location_id, [item_id+location_id]',
      customers: 'customer_id, name, customer_type',
      customerDevices: 'device_id, customer_id, serial_number, catalog_item_id',
      sales: 'sale_id, sale_number, sale_date, sale_type, location_id, customer_id',
      saleItems: 'sale_item_id, sale_id, item_id',
      payments: 'payment_id, sale_id, payment_date',
      maintenanceTickets: 'ticket_id, ticket_number, status, customer_id, location_id',
      partRequests: 'request_id, ticket_id, part_id, requested_by',
      partUsage: 'usage_id, ticket_id, part_id, used_by',
      settings: 'setting_id, setting_key, category'
    }

    this.version(1).stores(baseSchema)
    this.version(2).stores({
      ...baseSchema,
      attachments: 'attachment_id, item_id, created_at'
    })
  }
}

let db: OmegaDatabase | null = null

export const useDatabase = () => {
  if (!process.client) {
    return null
  }

  if (!db) {
    db = new OmegaDatabase()
  }

  return db
}
