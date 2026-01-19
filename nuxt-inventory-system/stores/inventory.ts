import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDatabase } from '~/composables/useDatabase'
import { createId } from '~/utils/id'
import type { Category, CategoryType, Inventory, Item, ItemAttachment, Location } from '~/types/database'

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

export const useInventoryStore = defineStore('inventory', () => {
  const items = ref<Item[]>([])
  const categories = ref<Category[]>([])
  const locations = ref<Location[]>([])
  const inventory = ref<Inventory[]>([])
  const attachments = ref<ItemAttachment[]>([])
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
    const [categoryCount, locationCount] = await Promise.all([
      db.categories.count(),
      db.locations.count()
    ])

    if (categoryCount === 0) {
      await db.categories.bulkAdd(defaultCategories)
    }

    if (locationCount === 0) {
      await db.locations.bulkAdd(defaultLocations)
    }
  }

  const loadAll = async () => {
    const db = getDb()
    await seedDefaults()
    const [itemRows, categoryRows, locationRows, inventoryRows, attachmentRows] = await Promise.all([
      db.items.toArray(),
      db.categories.toArray(),
      db.locations.toArray(),
      db.inventory.toArray(),
      db.attachments.toArray()
    ])

    items.value = itemRows
    categories.value = categoryRows
    locations.value = locationRows
    inventory.value = inventoryRows
    attachments.value = attachmentRows
    isLoaded.value = true
  }

  const createItem = async (payload: ItemInput) => {
    const db = getDb()
    const timestamp = nowIso()
    const itemId = payload.item_id ?? createId()
    const item: Item = {
      item_id: itemId,
      name: payload.name,
      description: payload.description ?? null,
      price: payload.price,
      cost: payload.cost,
      category_id: payload.category_id ?? null,
      location_id: payload.location_id ?? null,
      item_type: payload.item_type,
      is_for_maintenance: payload.is_for_maintenance,
      min_stock_level: payload.min_stock_level,
      reorder_quantity: payload.reorder_quantity,
      stock_location: payload.stock_location,
      sku: payload.sku ?? null,
      barcode: payload.barcode ?? null,
      weight: payload.weight ?? null,
      dimensions: payload.dimensions ?? null,
      manufacturer: payload.manufacturer ?? null,
      warranty_period: payload.warranty_period ?? null,
      created_at: timestamp,
      updated_at: timestamp,
      sync_status: 'SYNCED'
    }

    await db.items.add(item)
    items.value = [item, ...items.value]

    if (payload.inventory_location_id) {
      await upsertInventory(itemId, payload.inventory_location_id, payload.initial_quantity ?? 0)
    }

    return item
  }

  const updateItem = async (payload: Item) => {
    const db = getDb()
    const updated = { ...payload, updated_at: nowIso() }
    await db.items.put(updated)
    items.value = items.value.map((entry) => (entry.item_id === updated.item_id ? updated : entry))
  }

  const deleteItem = async (itemId: string) => {
    const db = getDb()
    await db.items.delete(itemId)
    await db.inventory.where('item_id').equals(itemId).delete()
    await db.attachments.where('item_id').equals(itemId).delete()
    items.value = items.value.filter((entry) => entry.item_id !== itemId)
    inventory.value = inventory.value.filter((entry) => entry.item_id !== itemId)
    attachments.value = attachments.value.filter((entry) => entry.item_id !== itemId)
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

  const createCategory = async (payload: CategoryInput) => {
    const db = getDb()
    const timestamp = nowIso()
    const category: Category = {
      category_id: createId(),
      name: payload.name,
      description: payload.description ?? null,
      category_type: payload.category_type,
      created_at: timestamp,
      updated_at: timestamp,
      sync_status: 'SYNCED'
    }

    await db.categories.add(category)
    categories.value = [category, ...categories.value]
    return category
  }

  const updateCategory = async (payload: Category) => {
    const db = getDb()
    const updated = { ...payload, updated_at: nowIso() }
    await db.categories.put(updated)
    categories.value = categories.value.map((entry) =>
      entry.category_id === updated.category_id ? updated : entry
    )
  }

  const deleteCategory = async (categoryId: string) => {
    const db = getDb()
    await db.categories.delete(categoryId)
    categories.value = categories.value.filter((entry) => entry.category_id !== categoryId)
  }

  const nextAttachmentOrder = (itemId: string) => {
    const current = attachments.value.filter((entry) => entry.item_id === itemId)
    const maxOrder = current.reduce((max, entry) => Math.max(max, entry.sort_order ?? 0), -1)
    return maxOrder + 1
  }

  const addAttachment = async (payload: AttachmentInput) => {
    const db = getDb()
    const attachment: ItemAttachment = {
      attachment_id: createId(),
      item_id: payload.item_id,
      file_name: payload.file_name,
      file_type: payload.file_type,
      file_size: payload.file_size,
      data_url: payload.data_url,
      sort_order: payload.sort_order ?? nextAttachmentOrder(payload.item_id),
      created_at: nowIso(),
      sync_status: 'SYNCED'
    }

    await db.attachments.add(attachment)
    attachments.value = [attachment, ...attachments.value]
    return attachment
  }

  const removeAttachment = async (attachmentId: string) => {
    const db = getDb()
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
    attachments,
    isLoaded,
    loadAll,
    createItem,
    updateItem,
    deleteItem,
    upsertInventory,
    createCategory,
    updateCategory,
    deleteCategory,
    addAttachment,
    removeAttachment,
    reorderAttachments
  }
})
