export type SyncStatus = 'PENDING' | 'SYNCED' | 'CONFLICT'

export type CategoryType = 'PRODUCT' | 'SPARE_PART' | 'BOTH'
export type ItemType = 'PRODUCT' | 'SPARE_PART'
export type LocationType = 'STORE' | 'WORKSHOP' | 'WAREHOUSE'
export type StockLocation = 'STORE' | 'WORKSHOP' | 'BOTH'
export type InventoryMovementType = 'RECEIPT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'SALE' | 'ISSUE' | 'ADJUSTMENT'
export type PricingMode = 'MANUAL' | 'MARGIN_PERCENT' | 'PRICE_LIST' | 'COST_SHEET'

export type SaleType = 'RETAIL' | 'MAINTENANCE' | 'INTERNAL'
export type SaleStatus = 'OPEN' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'VOID'
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED'
export type LineType = 'PRODUCT' | 'SPARE_PART' | 'LABOR' | 'FEE' | 'ADJUSTMENT'
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT' | 'MOBILE' | 'CHECK'

export type TicketStatus =
  | 'PENDING'
  | 'DIAGNOSIS'
  | 'WAITING_PARTS'
  | 'IN_PROGRESS'
  | 'TESTING'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED'

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type WarrantyStatus = 'IN_WARRANTY' | 'OUT_OF_WARRANTY' | 'EXTENDED'

export type PartSource = 'STORE_INVENTORY' | 'EXTERNAL_SUPPLIER' | 'CUSTOMER_PROVIDED'
export type PartRequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED'

export type SettingType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'DATE'

export type UserRole =
  | 'admin'
  | 'manager'
  | 'staff'
  | 'viewer'
  | 'technician'
  | 'sales'
  | 'maintenance_receiver'

export interface User {
  user_id: string
  email: string
  username: string
  name?: string | null
  role: UserRole
  is_active: boolean
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
}

export interface Category {
  category_id: string
  name: string
  description?: string | null
  category_type: CategoryType
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface Location {
  location_id: string
  name: string
  location_type: LocationType
  sub_city?: string | null
  house_no?: string | null
  city?: string | null
  country?: string | null
  po_box?: string | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface Item {
  item_id: string
  name: string
  model?: string | null
  serial_number?: string | null
  description?: string | null
  price: number
  cost: number
  category_id?: string | null
  location_id?: string | null
  item_type: ItemType
  is_for_maintenance: boolean
  min_stock_level: number
  reorder_quantity: number
  stock_location: StockLocation
  sku?: string | null
  vendor_sku?: string | null
  barcode?: string | null
  weight?: number | null
  dimensions?: string | null
  manufacturer?: string | null
  warranty_period?: number | null
  unit?: string | null
  employee_name?: string | null
  pricing_mode?: PricingMode
  margin_percent?: number | null
  price_override_reason?: string | null
  price_updated_at?: string | null
  cost_sheet_quantity?: number | null
  cost_sheet_unit_cost?: number | null
  cost_sheet_total_with_vat?: number | null
  cost_sheet_vat_rate?: number | null
  cost_sheet_entry_id?: string | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface Inventory {
  inventory_id: string
  item_id: string
  location_id: string
  quantity: number
  reserved_quantity: number
  batch_number?: string | null
  expiry_date?: string | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface Unit {
  unit_id: string
  name: string
  description?: string | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface CostSheetEntry {
  cost_sheet_id: string
  item_name: string
  model?: string | null
  unit?: string | null
  employee_name?: string | null
  quantity: number
  unit_cost: number
  total_with_vat: number
  vat_rate: number
  entry_date?: string | null
  item_id?: string | null
  added_to_inventory?: boolean
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface InventoryBatch {
  batch_id: string
  item_id: string
  location_id: string
  received_at: string
  quantity_received: number
  quantity_remaining: number
  unit_cost: number
  reference?: string | null
  employee_name?: string | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface InventoryMovement {
  movement_id: string
  item_id: string
  location_id: string
  quantity: number
  movement_type: InventoryMovementType
  reference_id?: string | null
  unit_cost?: number | null
  unit_price?: number | null
  notes?: string | null
  employee_name?: string | null
  attachment_data_url?: string | null
  attachment_file_name?: string | null
  attachment_file_type?: string | null
  attachment_file_size?: number | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface ItemAttachment {
  attachment_id: string
  item_id: string
  file_name: string
  file_type: string
  file_size: number
  data_url: string
  sort_order?: number | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface Customer {
  customer_id: string
  name: string
  name_amharic?: string | null
  email?: string | null
  phone?: string | null
  tin?: string | null
  vat_registration_no?: string | null
  address_id?: string | null
  customer_type?: 'RETAIL' | 'MAINTENANCE' | 'BOTH'
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface CustomerDevice {
  device_id: string
  customer_id: string
  catalog_item_id?: string | null
  item_name?: string | null
  brand?: string | null
  model?: string | null
  serial_number?: string | null
  purchase_date?: string | null
  warranty_expiry?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface Sale {
  sale_id: string
  sale_number?: string | null
  receipt_number?: string | null
  sale_date?: string
  sale_type: SaleType
  status: SaleStatus
  payment_status: PaymentStatus
  payment_method?: PaymentMethod | null
  customer_id?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  customer_tin?: string | null
  customer_vat_registration_no?: string | null
  maintenance_ticket_id?: string | null
  supplier_name?: string | null
  supplier_tin?: string | null
  vat_registration_date?: string | null
  supplier_vat_registration_no?: string | null
  supplier_address_sub_city?: string | null
  supplier_address_house_no?: string | null
  supplier_address_city?: string | null
  supplier_address_country?: string | null
  supplier_address_po_box?: string | null
  subtotal_amount: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  is_repair_service?: boolean
  repair_service_id?: string | null
  performed_by?: string | null
  shipping_address_id?: string | null
  notes?: string | null
  location_id: string
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface SaleItem {
  sale_item_id: string
  sale_id: string
  item_id?: string | null
  description?: string | null
  line_type: LineType
  quantity: number
  unit_price: number
  discount_amount: number
  tax_amount: number
  line_total: number
  affects_inventory: boolean
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface Payment {
  payment_id: string
  sale_id: string
  payment_date?: string
  amount: number
  payment_method: PaymentMethod
  payment_type: 'PAYMENT' | 'REFUND' | 'ADJUSTMENT'
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  transaction_reference?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface SaleAttachment {
  attachment_id: string
  sale_id: string
  file_name: string
  file_type: string
  file_size: number
  data_url: string
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface MaintenanceAttachment {
  attachment_id: string
  ticket_id: string
  file_name: string
  file_type: string
  file_size: number
  data_url: string
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}

export interface MaintenanceTicket {
  ticket_id: string
  ticket_number?: string | null
  receipt_number?: string | null
  receipt_attachment?: string | null
  customer_id: string
  customer_device_id: string
  technician_id?: string | null
  employee_name?: string | null
  status: TicketStatus
  problem_description: string
  diagnosis?: string | null
  estimated_cost?: number | null
  estimated_completion?: string | null
  repair_cost?: number | null
  labor_cost?: number | null
  labor_hours?: number | null
  total_cost?: number | null
  payment_status?: 'PENDING' | 'PAID' | 'PARTIAL' | 'INVOICED'
  priority: TicketPriority
  warranty_status: WarrantyStatus
  received_at?: string
  target_delivery_at?: string | null
  created_at?: string
  updated_at?: string
  completed_at?: string | null
  delivered_at?: string | null
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
  location_id: string
}

export interface PartRequest {
  request_id: string
  ticket_id: string
  customer_device_id: string
  part_id?: string | null
  external_item_name?: string | null
  external_model?: string | null
  external_cost?: number | null
  external_receipt_number?: string | null
  external_receipt_data_url?: string | null
  external_receipt_file_name?: string | null
  external_receipt_file_type?: string | null
  external_receipt_file_size?: number | null
  quantity_requested: number
  requested_by: string
  technician_id?: string | null
  requested_at?: string
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  approved_by?: string | null
  approved_at?: string | null
  status: PartRequestStatus
  source_preference: PartSource
  notes?: string | null
  location_id: string
  sync_status?: SyncStatus
}

export interface PartUsage {
  usage_id: string
  ticket_id: string
  request_id?: string | null
  sale_item_id?: string | null
  part_id: string
  quantity_used: number
  unit_cost: number
  total_cost?: number
  source: PartSource
  external_supplier_id?: string | null
  external_reference?: string | null
  used_by?: string | null
  used_at?: string
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  notes?: string | null
  sync_status?: SyncStatus
  location_id: string
}

export interface Setting {
  setting_id: string
  setting_key: string
  setting_value?: string | null
  setting_type: SettingType
  category?: string | null
  description?: string | null
  is_editable?: boolean
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  sync_status?: SyncStatus
}
