import { getPrismaClient } from '~/server/utils/prisma'
import { mapItem } from '~/server/utils/mappers'
import { toNumber } from '~/server/utils/serialize'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const user = await requireAuthUser(event)
  const itemId = event.context.params?.itemId
  if (!itemId) {
    throw createError({ statusCode: 400, statusMessage: 'ITEM_ID_REQUIRED' })
  }

  const body = await readBody(event)
  const existingItem = await prisma.item.findUnique({ where: { item_id: itemId } })
  if (!existingItem) {
    throw createError({ statusCode: 404, statusMessage: 'ITEM_NOT_FOUND' })
  }
  const hasCostSheetEntryId = Object.prototype.hasOwnProperty.call(body ?? {}, 'cost_sheet_entry_id')
  let costSheetEntryId = existingItem.cost_sheet_entry_id ?? null
  if (hasCostSheetEntryId) {
    const trimmed =
      typeof body?.cost_sheet_entry_id === 'string' ? body.cost_sheet_entry_id.trim() : ''
    costSheetEntryId = trimmed || null
  }

  const costSheetEntry = costSheetEntryId
    ? await prisma.costSheetEntry.findUnique({
        where: { cost_sheet_id: costSheetEntryId },
        include: { item: true }
      })
    : null
  if (costSheetEntryId && !costSheetEntry) {
    throw createError({ statusCode: 400, statusMessage: 'COST_SHEET_NOT_FOUND' })
  }
  if (costSheetEntry?.item && costSheetEntry.item.item_id !== itemId) {
    throw createError({ statusCode: 409, statusMessage: 'COST_SHEET_ALREADY_USED' })
  }

  const nextName = costSheetEntry
    ? costSheetEntry.item_name.trim()
    : typeof body?.name === 'string'
      ? body.name.trim()
      : existingItem.name
  if (!nextName) {
    throw createError({ statusCode: 400, statusMessage: 'NAME_REQUIRED' })
  }
  const nextModel = costSheetEntry
    ? costSheetEntry.model ?? ''
    : typeof body?.model === 'string'
      ? body.model.trim()
      : existingItem.model ?? ''
  const normalizedModel = nextModel ? nextModel : null
  const nextSerial =
    typeof body?.serial_number === 'string'
      ? body.serial_number.trim()
      : existingItem.serial_number ?? ''
  const normalizedSerial = nextSerial ? nextSerial : null

  const duplicate = await prisma.item.findFirst({
    where: {
      item_id: { not: itemId },
      name: { equals: nextName, mode: 'insensitive' },
      model: normalizedModel ? { equals: normalizedModel, mode: 'insensitive' } : { equals: null }
    }
  })
  if (duplicate) {
    throw createError({ statusCode: 409, statusMessage: 'ITEM_ALREADY_EXISTS' })
  }

  if (body?.sku) {
    const trimmedSku = String(body.sku).trim()
    if (trimmedSku) {
      const existing = await prisma.item.findFirst({
        where: {
          sku: trimmedSku,
          item_id: { not: itemId }
        }
      })
      if (existing) {
        throw createError({ statusCode: 409, statusMessage: 'SKU_ALREADY_EXISTS' })
      }
      body.sku = trimmedSku
    } else {
      body.sku = null
    }
  }

  const pricingMode = costSheetEntryId ? 'COST_SHEET' : body.pricing_mode ?? existingItem.pricing_mode ?? 'MANUAL'
  const costSheetQuantity = costSheetEntry
    ? costSheetEntry.quantity
    : Number(body.cost_sheet_quantity ?? existingItem.cost_sheet_quantity ?? 0)
  const costSheetUnitCost = costSheetEntry
    ? toNumber(costSheetEntry.unit_cost) ?? 0
    : Number(body.cost_sheet_unit_cost ?? existingItem.cost_sheet_unit_cost ?? 0)
  let normalizedVatRate = costSheetEntry ? costSheetEntry.vat_rate : 0
  if (!costSheetEntry) {
    const vatSetting = await prisma.setting.findFirst({ where: { setting_key: 'tax_rate' } })
    const vatRate = Number(vatSetting?.setting_value ?? 0)
    normalizedVatRate = Number.isFinite(vatRate) ? vatRate : 0
  }
  const costSheetUnitPrice = costSheetUnitCost * (1 + normalizedVatRate)
  const costSheetTotalWithVat = costSheetUnitPrice
  const finalPrice = pricingMode === 'COST_SHEET' ? costSheetUnitPrice : body.price ?? existingItem.price
  const finalCost = pricingMode === 'COST_SHEET' ? costSheetUnitCost : body.cost ?? existingItem.cost
  const shouldStoreCostSheetVatRate =
    Boolean(costSheetEntryId) || costSheetQuantity > 0 || costSheetUnitCost > 0
  const nextUnit =
    costSheetEntry?.unit ??
    (typeof body?.unit === 'string' && body.unit.trim() ? body.unit.trim() : existingItem.unit ?? null)

  const priceChanged = Number(existingItem.price) !== Number(finalPrice)
  const overrideReason =
    typeof body.price_override_reason === 'string' ? body.price_override_reason.trim() : undefined

  const item = await prisma.item.update({
    where: { item_id: itemId },
    data: {
      name: nextName,
      model: normalizedModel,
      serial_number: normalizedSerial,
      description: body.description ?? null,
      price: finalPrice,
      cost: finalCost,
      category_id: body.category_id ?? null,
      location_id: body.location_id ?? null,
      item_type: body.item_type,
      is_for_maintenance: Boolean(body.is_for_maintenance),
      min_stock_level: body.min_stock_level ?? 0,
      reorder_quantity: body.reorder_quantity ?? 0,
      stock_location: body.stock_location,
      sku: body.sku ?? null,
      vendor_sku: typeof body.vendor_sku === 'string' && body.vendor_sku.trim() ? body.vendor_sku.trim() : null,
      barcode: body.barcode ?? null,
      weight: body.weight ?? null,
      dimensions: body.dimensions ?? null,
      manufacturer: body.manufacturer ?? null,
      warranty_period: body.warranty_period ?? null,
      unit: nextUnit,
      pricing_mode: pricingMode,
      margin_percent: body.margin_percent ?? existingItem.margin_percent ?? null,
      price_override_reason: overrideReason !== undefined ? overrideReason || null : undefined,
      price_updated_at: priceChanged ? new Date() : undefined,
      cost_sheet_quantity: costSheetQuantity > 0 ? costSheetQuantity : null,
      cost_sheet_unit_cost: costSheetUnitCost > 0 ? costSheetUnitCost : null,
      cost_sheet_total_with_vat: costSheetTotalWithVat > 0 ? costSheetTotalWithVat : null,
      cost_sheet_vat_rate: shouldStoreCostSheetVatRate ? normalizedVatRate : null,
      cost_sheet_entry_id: costSheetEntryId,
      updated_by: user.user_id,
      sync_status: 'SYNCED'
    }
  })

  return mapItem(item)
})
