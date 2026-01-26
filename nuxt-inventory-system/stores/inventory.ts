import { defineStore } from 'pinia'
import { $fetch } from 'ofetch'
import { ref } from 'vue'
import { useDatabase } from '~/composables/useDatabase'
import { createId } from '~/utils/id'
import type {
  Category,
  CategoryType,
  CostSheetEntry,
  Inventory,
  InventoryBatch,
  InventoryMovement,
  Item,
  ItemAttachment,
  Location,
  LocationType,
  Unit
} from '~/types/database'

const nowIso = () => new Date().toISOString()

const defaultCategories: Category[] = [
  {
    category_id: 'cat-speakers-001',
    name: 'Speakers',
    description: 'Audio speakers and sound systems',
    category_type: 'PRODUCT'
  },
  {
    category_id: 'cat-tvs-001',
    name: 'Televisions',
    description: 'TVs and displays',
    category_type: 'PRODUCT'
  },
  {
    category_id: 'cat-fridges-001',
    name: 'Refrigerators',
    description: 'Cooling appliances',
    category_type: 'PRODUCT'
  },
  {
    category_id: 'cat-keyboards-001',
    name: 'Music Keyboards',
    description: 'Musical instruments',
    category_type: 'PRODUCT'
  },
  {
    category_id: 'cat-spare-parts-001',
    name: 'Spare Parts',
    description: 'Repair and replacement parts',
    category_type: 'SPARE_PART'
  },
  {
    category_id: 'cat-accessories-001',
    name: 'Accessories',
    description: 'Cables, remotes, stands',
    category_type: 'BOTH'
  }
]

const defaultLocations: Location[] = [
  {
    location_id: 'store-location-001',
    name: 'Main Store',
    location_type: 'STORE'
  },
  {
    location_id: 'workshop-location-001',
    name: 'Repair Workshop',
    location_type: 'WORKSHOP'
  }
]

const defaultUnits: Unit[] = [
  { unit_id: 'unit-piece', name: 'Piece' },
  { unit_id: 'unit-roll', name: 'Roll' },
  { unit_id: 'unit-box', name: 'Box' },
  { unit_id: 'unit-set', name: 'Set' }
]

export type ItemInput = Omit<Item, 'item_id' | 'created_at' | 'updated_at' | 'sync_status'> & {
  item_id?: string
  initial_quantity?: number
  inventory_location_id?: string | null
}

export type CategoryInput = {
  name: string
  description?: string | null
  category_type: CategoryType
}

export type AttachmentInput = {
  item_id: string
  file_name: string
  file_type: string
  file_size: number
  data_url: string
  sort_order?: number | null
}

export type StockReceiptInput = {
  item_id: string
  location_id: string
  received_at: string
  quantity_received: number
  unit_cost: number
  reference?: string | null
}

export type StockIssueInput = {
  item_id: string
  location_id: string
  quantity: number
}

export type StockTransferInput = {
  item_id: string
  from_location_id: string
  to_location_id: string
  quantity: number
  transferred_at?: string | null
  reference?: string | null
  notes?: string | null
  employee_name?: string | null
  attachment_data_url?: string | null
  attachment_file_name?: string | null
  attachment_file_type?: string | null
  attachment_file_size?: number | null
}

export type LocationInput = {
  name: string
  location_type: LocationType
  sub_city?: string | null
  house_no?: string | null
  city?: string | null
  country?: string | null
  po_box?: string | null
}

export type CostSheetEntryInput = {
  item_name: string
  model?: string | null
  unit?: string | null
  quantity: number
  unit_cost: number
  entry_date?: string | null
}

export const useInventoryStore = defineStore('inventory', () => {
  const items = ref<Item[]>([])
  const categories = ref<Category[]>([])
  const locations = ref<Location[]>([])
  const inventory = ref<Inventory[]>([])
  const batches = ref<InventoryBatch[]>([])
  const movements = ref<InventoryMovement[]>([])
  const units = ref<Unit[]>([])
  const attachments = ref<ItemAttachment[]>([])
  const costSheets = ref<CostSheetEntry[]>([])
  const isLoaded = ref(false)

  const getDb = () => {
    const db = useDatabase()
    if (!db) {
      throw new Error('Database is only available on the client')
    }

    return db
  }

  const seedDefaults = async () => {
    const db = getDb()
    const [categoryCount, locationCount, unitCount] = await Promise.all([
      db.categories.count(),
      db.locations.count(),
      db.units.count()
    ])

    if (categoryCount === 0) {
      await db.categories.bulkAdd(defaultCategories)
    }

    if (locationCount === 0) {
      await db.locations.bulkAdd(defaultLocations)
    }

    if (unitCount === 0) {
      await db.units.bulkAdd(defaultUnits)
    }
  }

  const cacheInventory = async (payload: {
    items: Item[]
    categories: Category[]
    locations: Location[]
    inventory: Inventory[]
    batches: InventoryBatch[]
    movements: InventoryMovement[]
    units: Unit[]
    attachments: ItemAttachment[]
    costSheets: CostSheetEntry[]
  }) => {
    const db = getDb()
    await db.transaction(
      'rw',
      db.items,
      db.categories,
      db.locations,
      db.inventory,
      db.inventoryBatches,
      db.inventoryMovements,
      db.units,
      db.attachments,
      db.costSheets,
      async () => {
        await db.items.clear()
        await db.categories.clear()
        await db.locations.clear()
        await db.inventory.clear()
        await db.inventoryBatches.clear()
        await db.inventoryMovements.clear()
        await db.units.clear()
        await db.attachments.clear()
        await db.costSheets.clear()

        await db.items.bulkAdd(payload.items)
        await db.categories.bulkAdd(payload.categories)
        await db.locations.bulkAdd(payload.locations)
        await db.inventory.bulkAdd(payload.inventory)
        await db.inventoryBatches.bulkAdd(payload.batches)
        await db.inventoryMovements.bulkAdd(payload.movements)
        await db.units.bulkAdd(payload.units)
        await db.attachments.bulkAdd(payload.attachments)
        await db.costSheets.bulkAdd(payload.costSheets)
      }
    )
  }

  const loadAll = async () => {
    const db = getDb()
    try {
      const payload = await $fetch<{
        items: Item[]
        categories: Category[]
        locations: Location[]
        inventory: Inventory[]
        batches: InventoryBatch[]
        movements: InventoryMovement[]
        units: Unit[]
        attachments: ItemAttachment[]
        costSheets: CostSheetEntry[]
      }>('/api/inventory')
      items.value = payload.items
      categories.value = payload.categories
      locations.value = payload.locations
      inventory.value = payload.inventory
      batches.value = payload.batches
      movements.value = payload.movements
      attachments.value = payload.attachments
      units.value = payload.units
      costSheets.value = payload.costSheets
      isLoaded.value = true
      await cacheInventory(payload)
      return
    } catch (error) {
      console.warn('Failed to load inventory from server, falling back to cache.', error)
    }

    await seedDefaults()
    const [
      itemRows,
      categoryRows,
      locationRows,
      inventoryRows,
      batchRows,
      movementRows,
      attachmentRows,
      unitRows,
      costSheetRows
    ] = await Promise.all([
      db.items.toArray(),
      db.categories.toArray(),
      db.locations.toArray(),
      db.inventory.toArray(),
      db.inventoryBatches.toArray(),
      db.inventoryMovements.toArray(),
      db.attachments.toArray(),
      db.units.toArray(),
      db.costSheets.toArray()
    ])

    items.value = itemRows
    categories.value = categoryRows
    locations.value = locationRows
    inventory.value = inventoryRows
    batches.value = batchRows
    movements.value = movementRows
    attachments.value = attachmentRows
    units.value = unitRows
    costSheets.value = costSheetRows
    isLoaded.value = true
  }

  const createItem = async (payload: ItemInput) => {
    const db = getDb()
    const item = await $fetch<Item>('/api/inventory/items', {
      method: 'POST',
      body: {
        ...payload,
        unit: payload.unit?.trim() ? payload.unit.trim() : null
      }
    })

    items.value = [item, ...items.value]
    await db.items.put(item)
    if (payload.cost_sheet_entry_id) {
      const updatedEntries = costSheets.value.map((entry) =>
        entry.cost_sheet_id === payload.cost_sheet_entry_id
          ? { ...entry, item_id: item.item_id, added_to_inventory: true }
          : entry
      )
      costSheets.value = updatedEntries
      const updated = updatedEntries.find((entry) => entry.cost_sheet_id === payload.cost_sheet_entry_id)
      if (updated) {
        await db.costSheets.put(updated)
      }
    }
    return item
  }

  const updateItem = async (payload: Item) => {
    const db = getDb()
    const previous = items.value.find((entry) => entry.item_id === payload.item_id)
    const updated = await $fetch<Item>(`/api/inventory/items/${payload.item_id}`, {
      method: 'PUT',
      body: payload
    })
    items.value = items.value.map((entry) => (entry.item_id === updated.item_id ? updated : entry))
    await db.items.put(updated)
    if (previous?.cost_sheet_entry_id && previous.cost_sheet_entry_id !== updated.cost_sheet_entry_id) {
      const cleared = costSheets.value.find((entry) => entry.cost_sheet_id === previous.cost_sheet_entry_id)
      if (cleared) {
        const next = { ...cleared, item_id: null, added_to_inventory: false }
        costSheets.value = costSheets.value.map((entry) =>
          entry.cost_sheet_id === next.cost_sheet_id ? next : entry
        )
        await db.costSheets.put(next)
      }
    }
    if (updated.cost_sheet_entry_id) {
      const linked = costSheets.value.find((entry) => entry.cost_sheet_id === updated.cost_sheet_entry_id)
      if (linked) {
        const next = { ...linked, item_id: updated.item_id, added_to_inventory: true }
        costSheets.value = costSheets.value.map((entry) =>
          entry.cost_sheet_id === next.cost_sheet_id ? next : entry
        )
        await db.costSheets.put(next)
      }
    }
  }

  const deleteItem = async (itemId: string) => {
    const db = getDb()
    const existing = items.value.find((entry) => entry.item_id === itemId)
    await $fetch(`/api/inventory/items/${itemId}`, { method: 'DELETE' })
    await db.items.delete(itemId)
    await db.inventory.where('item_id').equals(itemId).delete()
    await db.inventoryBatches.where('item_id').equals(itemId).delete()
    await db.attachments.where('item_id').equals(itemId).delete()
    items.value = items.value.filter((entry) => entry.item_id !== itemId)
    inventory.value = inventory.value.filter((entry) => entry.item_id !== itemId)
    batches.value = batches.value.filter((entry) => entry.item_id !== itemId)
    attachments.value = attachments.value.filter((entry) => entry.item_id !== itemId)
    if (existing?.cost_sheet_entry_id) {
      const entry = costSheets.value.find((sheet) => sheet.cost_sheet_id === existing.cost_sheet_entry_id)
      if (entry) {
        const updated = { ...entry, item_id: null, added_to_inventory: false }
        costSheets.value = costSheets.value.map((sheet) =>
          sheet.cost_sheet_id === updated.cost_sheet_id ? updated : sheet
        )
        await db.costSheets.put(updated)
      }
    }
  }

  const upsertInventory = async (itemId: string, locationId: string, quantity: number) => {
    const db = getDb()
    const existing = await db.inventory
      .where('[item_id+location_id]')
      .equals([itemId, locationId])
      .first()

    if (existing) {
      const updated: Inventory = {
        ...existing,
        quantity,
        updated_at: nowIso()
      }
      await db.inventory.put(updated)
      inventory.value = inventory.value.map((entry) =>
        entry.inventory_id === updated.inventory_id ? updated : entry
      )
      return
    }

    const newInventory: Inventory = {
      inventory_id: createId(),
      item_id: itemId,
      location_id: locationId,
      quantity,
      reserved_quantity: 0,
      created_at: nowIso(),
      updated_at: nowIso(),
      sync_status: 'SYNCED'
    }
    await db.inventory.add(newInventory)
    inventory.value = [newInventory, ...inventory.value]
  }

  const receiveStock = async (payload: StockReceiptInput) => {
    const db = getDb()
    const response = await $fetch<{
      batch: InventoryBatch
      item: Item
      inventory: Inventory
      movement: InventoryMovement
    }>('/api/inventory/batches', {
      method: 'POST',
      body: payload
    })

    batches.value = [response.batch, ...batches.value]
    movements.value = [response.movement, ...movements.value]
    const itemIndex = items.value.findIndex((entry) => entry.item_id === response.item.item_id)
    if (itemIndex >= 0) {
      items.value = items.value.map((entry, index) => (index === itemIndex ? response.item : entry))
    } else {
      items.value = [response.item, ...items.value]
    }
    const inventoryIndex = inventory.value.findIndex(
      (entry) =>
        entry.item_id === response.inventory.item_id &&
        entry.location_id === response.inventory.location_id
    )
    if (inventoryIndex >= 0) {
      inventory.value = inventory.value.map((entry, index) =>
        index === inventoryIndex ? response.inventory : entry
      )
    } else {
      inventory.value = [response.inventory, ...inventory.value]
    }

    await db.inventoryBatches.put(response.batch)
    await db.items.put(response.item)
    await db.inventory.put(response.inventory)
    await db.inventoryMovements.put(response.movement)

    return response.batch
  }

  const transferStock = async (payload: StockTransferInput) => {
    const db = getDb()
    const response = await $fetch<{
      transfer_id: string
      movement_out: InventoryMovement
      movement_in: InventoryMovement
      batches: InventoryBatch[]
      updated_batches: InventoryBatch[]
      inventory: Inventory[]
    }>('/api/inventory/transfers', {
      method: 'POST',
      body: payload
    })

    const updatedBatchMap = new Map(response.updated_batches.map((batch) => [batch.batch_id, batch]))
    batches.value = batches.value.map((batch) => updatedBatchMap.get(batch.batch_id) ?? batch)
    batches.value = [...response.batches, ...batches.value]
    await db.inventoryBatches.bulkPut([...response.updated_batches, ...response.batches])

    const nextInventory = [...inventory.value]
    for (const row of response.inventory) {
      const index = nextInventory.findIndex((entry) => entry.inventory_id === row.inventory_id)
      if (index >= 0) {
        nextInventory[index] = row
      } else {
        nextInventory.unshift(row)
      }
      await db.inventory.put(row)
    }
    inventory.value = nextInventory

    movements.value = [response.movement_out, response.movement_in, ...movements.value]
    await db.inventoryMovements.bulkPut([response.movement_out, response.movement_in])

    return response.transfer_id
  }

  const getOnHand = (itemId: string, locationId?: string) => {
    return inventory.value
      .filter((entry) => entry.item_id === itemId && (!locationId || entry.location_id === locationId))
      .reduce((sum, entry) => sum + entry.quantity, 0)
  }

  const getReserved = (itemId: string, locationId?: string) => {
    return inventory.value
      .filter((entry) => entry.item_id === itemId && (!locationId || entry.location_id === locationId))
      .reduce((sum, entry) => sum + (entry.reserved_quantity ?? 0), 0)
  }

  const getAvailable = (itemId: string, locationId?: string) => {
    return getOnHand(itemId, locationId) - getReserved(itemId, locationId)
  }

  const reserveStock = async (payload: StockIssueInput) => {
    const db = getDb()
    const existing = await db.inventory
      .where('[item_id+location_id]')
      .equals([payload.item_id, payload.location_id])
      .first()

    const nextReserved = (existing?.reserved_quantity ?? 0) + payload.quantity
    if (nextReserved < 0) {
      throw new Error('NEGATIVE_RESERVED')
    }

    if (existing) {
      const updated: Inventory = {
        ...existing,
        reserved_quantity: nextReserved,
        updated_at: nowIso(),
        sync_status: 'SYNCED'
      }
      await db.inventory.put(updated)
      inventory.value = inventory.value.map((entry) =>
        entry.inventory_id === updated.inventory_id ? updated : entry
      )
      return
    }

    const row: Inventory = {
      inventory_id: createId(),
      item_id: payload.item_id,
      location_id: payload.location_id,
      quantity: 0,
      reserved_quantity: payload.quantity,
      created_at: nowIso(),
      updated_at: nowIso(),
      sync_status: 'SYNCED'
    }
    await db.inventory.add(row)
    inventory.value = [row, ...inventory.value]
  }

  const releaseStock = async (payload: StockIssueInput) => {
    await reserveStock({ ...payload, quantity: -payload.quantity })
  }

  const consumeStockFIFO = async (payload: StockIssueInput) => {
    const db = getDb()
    const candidates = batches.value
      .filter(
        (batch) =>
          batch.item_id === payload.item_id &&
          batch.location_id === payload.location_id &&
          batch.quantity_remaining > 0
      )
      .sort((a, b) => a.received_at.localeCompare(b.received_at))

    let remaining = payload.quantity
    const updates: InventoryBatch[] = []

    for (const batch of candidates) {
      if (remaining <= 0) {
        break
      }
      const deduct = Math.min(batch.quantity_remaining, remaining)
      updates.push({
        ...batch,
        quantity_remaining: batch.quantity_remaining - deduct,
        updated_at: nowIso()
      })
      remaining -= deduct
    }

    if (remaining > 0) {
      throw new Error('INSUFFICIENT_STOCK')
    }

    if (updates.length > 0) {
      await db.inventoryBatches.bulkPut(updates)
      batches.value = batches.value.map((entry) => {
        const updated = updates.find((batch) => batch.batch_id === entry.batch_id)
        return updated ?? entry
      })
    }
  }

  const createCategory = async (payload: CategoryInput) => {
    const db = getDb()
    const category = await $fetch<Category>('/api/inventory/categories', {
      method: 'POST',
      body: payload
    })
    categories.value = [category, ...categories.value]
    await db.categories.put(category)
    return category
  }

  const createLocation = async (payload: LocationInput) => {
    const db = getDb()
    const location = await $fetch<Location>('/api/inventory/locations', {
      method: 'POST',
      body: {
        ...payload,
        name: payload.name.trim(),
        sub_city: payload.sub_city?.trim() || null,
        house_no: payload.house_no?.trim() || null,
        city: payload.city?.trim() || null,
        country: payload.country?.trim() || null,
        po_box: payload.po_box?.trim() || null
      }
    })
    locations.value = [location, ...locations.value]
    await db.locations.put(location)
    return location
  }

  const updateLocation = async (payload: Location) => {
    const db = getDb()
    const updated = await $fetch<Location>(`/api/inventory/locations/${payload.location_id}`, {
      method: 'PUT',
      body: payload
    })
    locations.value = locations.value.map((entry) =>
      entry.location_id === updated.location_id ? updated : entry
    )
    await db.locations.put(updated)
  }

  const deleteLocation = async (locationId: string) => {
    const db = getDb()
    await $fetch(`/api/inventory/locations/${locationId}`, { method: 'DELETE' })
    await db.locations.delete(locationId)
    locations.value = locations.value.filter((entry) => entry.location_id !== locationId)
  }

  const createUnit = async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) {
      throw new Error('UNIT_NAME_REQUIRED')
    }
    const db = getDb()
    const unit = await $fetch<Unit>('/api/inventory/units', {
      method: 'POST',
      body: { name: trimmed }
    })
    units.value = [unit, ...units.value]
    await db.units.put(unit)
    return unit
  }

  const createCostSheetEntry = async (payload: CostSheetEntryInput) => {
    const db = getDb()
    const entry = await $fetch<CostSheetEntry>('/api/cost-sheet', {
      method: 'POST',
      body: payload
    })
    costSheets.value = [entry, ...costSheets.value]
    await db.costSheets.put(entry)
    return entry
  }

  const updateCostSheetEntry = async (entryId: string, payload: CostSheetEntryInput) => {
    const db = getDb()
    const updated = await $fetch<CostSheetEntry>(`/api/cost-sheet/${entryId}`, {
      method: 'PUT',
      body: payload
    })
    costSheets.value = costSheets.value.map((entry) =>
      entry.cost_sheet_id === updated.cost_sheet_id ? updated : entry
    )
    await db.costSheets.put(updated)
    return updated
  }

  const updateCategory = async (payload: Category) => {
    const db = getDb()
    const updated = await $fetch<Category>(`/api/inventory/categories/${payload.category_id}`, {
      method: 'PUT',
      body: payload
    })
    categories.value = categories.value.map((entry) =>
      entry.category_id === updated.category_id ? updated : entry
    )
    await db.categories.put(updated)
  }

  const deleteCategory = async (categoryId: string) => {
    const db = getDb()
    await $fetch(`/api/inventory/categories/${categoryId}`, { method: 'DELETE' })
    await db.categories.delete(categoryId)
    categories.value = categories.value.filter((entry) => entry.category_id !== categoryId)
  }

  const reassignCategory = async (fromCategoryId: string, toCategoryId: string | null) => {
    const db = getDb()
    const response = await $fetch<{ updated: Item[] }>('/api/inventory/categories/reassign', {
      method: 'POST',
      body: { fromCategoryId, toCategoryId }
    })
    if (response.updated.length === 0) {
      return
    }
    items.value = items.value.map((entry) => {
      const updated = response.updated.find((item) => item.item_id === entry.item_id)
      return updated ?? entry
    })
    await db.items.bulkPut(response.updated)
  }

  const nextAttachmentOrder = (itemId: string) => {
    const current = attachments.value.filter((entry) => entry.item_id === itemId)
    const maxOrder = current.reduce((max, entry) => Math.max(max, entry.sort_order ?? 0), -1)
    return maxOrder + 1
  }

  const addAttachment = async (payload: AttachmentInput) => {
    const db = getDb()
    const attachment = await $fetch<ItemAttachment>('/api/inventory/attachments', {
      method: 'POST',
      body: {
        ...payload,
        sort_order: payload.sort_order ?? nextAttachmentOrder(payload.item_id)
      }
    })

    attachments.value = [attachment, ...attachments.value]
    await db.attachments.put(attachment)
    return attachment
  }

  const removeAttachment = async (attachmentId: string) => {
    const db = getDb()
    await $fetch(`/api/inventory/attachments/${attachmentId}`, { method: 'DELETE' })
    await db.attachments.delete(attachmentId)
    attachments.value = attachments.value.filter((entry) => entry.attachment_id !== attachmentId)
  }

  const reorderAttachments = async (itemId: string, orderedIds: string[]) => {
    const db = getDb()
    const updates = orderedIds.map((attachmentId, index) => {
      const existing = attachments.value.find((entry) => entry.attachment_id === attachmentId)
      if (!existing) {
        return null
      }
      return {
        ...existing,
        item_id: itemId,
        sort_order: index
      } satisfies ItemAttachment
    })
    const validUpdates = updates.filter((entry): entry is ItemAttachment => Boolean(entry))
    if (!validUpdates.length) {
      return
    }
    await $fetch('/api/inventory/attachments/reorder', {
      method: 'PUT',
      body: { item_id: itemId, ordered_ids: orderedIds }
    })
    await db.attachments.bulkPut(validUpdates)
    attachments.value = attachments.value.map((entry) => {
      const updated = validUpdates.find((update) => update.attachment_id === entry.attachment_id)
      return updated ?? entry
    })
  }

  return {
    items,
    categories,
    locations,
    inventory,
    batches,
    movements,
    units,
    attachments,
    costSheets,
    isLoaded,
    loadAll,
    createItem,
    updateItem,
    deleteItem,
    upsertInventory,
    receiveStock,
    transferStock,
    getOnHand,
    getReserved,
    getAvailable,
    reserveStock,
    releaseStock,
    consumeStockFIFO,
    createCategory,
    createLocation,
    updateLocation,
    deleteLocation,
    createUnit,
    createCostSheetEntry,
    updateCostSheetEntry,
    updateCategory,
    deleteCategory,
    reassignCategory,
    addAttachment,
    removeAttachment,
    reorderAttachments
  }
})
