import Dexie from 'dexie'
import type { Table } from 'dexie'
import type {
  Category,
  Customer,
  CustomerDevice,
  CostSheetEntry,
  Inventory,
  InventoryBatch,
  InventoryMovement,
  Item,
  ItemAttachment,
  Location,
  MaintenanceTicket,
  MaintenanceAttachment,
  PartRequest,
  PartUsage,
  Payment,
  Sale,
  SaleAttachment,
  SaleItem,
  Setting,
  Unit
} from '~/types/database'

export class OmegaDatabase extends Dexie {
  items!: Table<Item, 'item_id'>
  categories!: Table<Category, 'category_id'>
  locations!: Table<Location, 'location_id'>
  inventory!: Table<Inventory, 'inventory_id'>
  inventoryBatches!: Table<InventoryBatch, 'batch_id'>
  inventoryMovements!: Table<InventoryMovement, 'movement_id'>
  units!: Table<Unit, 'unit_id'>
  attachments!: Table<ItemAttachment, 'attachment_id'>
  costSheets!: Table<CostSheetEntry, 'cost_sheet_id'>
  customers!: Table<Customer, 'customer_id'>
  customerDevices!: Table<CustomerDevice, 'device_id'>
  sales!: Table<Sale, 'sale_id'>
  saleItems!: Table<SaleItem, 'sale_item_id'>
  payments!: Table<Payment, 'payment_id'>
  saleAttachments!: Table<SaleAttachment, 'attachment_id'>
  maintenanceTickets!: Table<MaintenanceTicket, 'ticket_id'>
  maintenanceAttachments!: Table<MaintenanceAttachment, 'attachment_id'>
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
    this.version(3).stores({
      ...baseSchema,
      attachments: 'attachment_id, item_id, created_at',
      inventoryBatches: 'batch_id, item_id, location_id, received_at, [item_id+location_id]'
    })
    this.version(4).stores({
      ...baseSchema,
      attachments: 'attachment_id, item_id, created_at',
      inventoryBatches: 'batch_id, item_id, location_id, received_at, [item_id+location_id]',
      units: 'unit_id, name'
    })
    this.version(5).stores({
      ...baseSchema,
      attachments: 'attachment_id, item_id, created_at',
      inventoryBatches: 'batch_id, item_id, location_id, received_at, [item_id+location_id]',
      units: 'unit_id, name',
      costSheets: 'cost_sheet_id, item_name, model, unit'
    })
    this.version(6).stores({
      ...baseSchema,
      attachments: 'attachment_id, item_id, created_at',
      inventoryBatches: 'batch_id, item_id, location_id, received_at, [item_id+location_id]',
      inventoryMovements: 'movement_id, item_id, location_id, movement_type, created_at, [item_id+location_id]',
      units: 'unit_id, name',
      costSheets: 'cost_sheet_id, item_name, model, unit'
    })
    this.version(7).stores({
      ...baseSchema,
      attachments: 'attachment_id, item_id, created_at',
      inventoryBatches: 'batch_id, item_id, location_id, received_at, [item_id+location_id]',
      inventoryMovements: 'movement_id, item_id, location_id, movement_type, created_at, [item_id+location_id]',
      units: 'unit_id, name',
      costSheets: 'cost_sheet_id, item_name, model, unit',
      saleAttachments: 'attachment_id, sale_id, created_at'
    })
    this.version(8).stores({
      ...baseSchema,
      attachments: 'attachment_id, item_id, created_at',
      inventoryBatches: 'batch_id, item_id, location_id, received_at, [item_id+location_id]',
      inventoryMovements: 'movement_id, item_id, location_id, movement_type, created_at, [item_id+location_id]',
      units: 'unit_id, name',
      costSheets: 'cost_sheet_id, item_name, model, unit',
      saleAttachments: 'attachment_id, sale_id, created_at',
      maintenanceAttachments: 'attachment_id, ticket_id, created_at'
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
