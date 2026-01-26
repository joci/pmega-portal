import { ensureCoreSeed } from '~/server/utils/seed'
import { getPrismaClient } from '~/server/utils/prisma'
import {
  mapAttachment,
  mapCategory,
  mapCostSheetEntry,
  mapInventory,
  mapInventoryBatch,
  mapInventoryMovement,
  mapItem,
  mapLocation,
  mapUnit
} from '~/server/utils/mappers'

export default defineEventHandler(async () => {
  const prisma = getPrismaClient()
  await ensureCoreSeed(prisma)

  const [categories, locations, units, items, inventory, batches, attachments, costSheets, movements] =
    await prisma.$transaction([
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.location.findMany({ orderBy: { name: 'asc' } }),
      prisma.unit.findMany({ orderBy: { name: 'asc' } }),
      prisma.item.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.inventory.findMany(),
      prisma.inventoryBatch.findMany({ orderBy: { received_at: 'asc' } }),
      prisma.itemAttachment.findMany({ orderBy: { created_at: 'asc' } }),
      prisma.costSheetEntry.findMany({ orderBy: { created_at: 'desc' }, include: { item: true } }),
      prisma.inventoryMovement.findMany({ orderBy: { created_at: 'asc' } })
    ])

  return {
    categories: categories.map(mapCategory),
    locations: locations.map(mapLocation),
    units: units.map(mapUnit),
    items: items.map(mapItem),
    inventory: inventory.map(mapInventory),
    batches: batches.map(mapInventoryBatch),
    attachments: attachments.map(mapAttachment),
    costSheets: costSheets.map(mapCostSheetEntry),
    movements: movements.map(mapInventoryMovement)
  }
})
