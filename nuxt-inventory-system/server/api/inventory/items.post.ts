import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapItem } from '~/server/utils/mappers'
import { generateSku } from '~/server/utils/sku'
import { toNumber } from '~/server/utils/serialize'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  const costSheetEntryId = typeof body?.cost_sheet_entry_id === 'string' ? body.cost_sheet_entry_id.trim() : ''
  const costSheetEntry = costSheetEntryId
    ? await prisma.costSheetEntry.findUnique({
        where: { cost_sheet_id: costSheetEntryId },
        include: { item: true }
      })
    : null
  if (costSheetEntryId && !costSheetEntry) {
    throw createError({ statusCode: 400, statusMessage: 'COST_SHEET_NOT_FOUND' })
  }
  if (costSheetEntry?.item) {
    throw createError({ statusCode: 409, statusMessage: 'COST_SHEET_ALREADY_USED' })
  }

  const name = costSheetEntry
    ? costSheetEntry.item_name.trim()
    : typeof body?.name === 'string'
      ? body.name.trim()
      : ''
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'NAME_REQUIRED' })
  }
  const model = costSheetEntry
    ? costSheetEntry.model ?? ''
    : typeof body.model === 'string'
      ? body.model.trim()
      : ''
  const normalizedModel = model || null

  const duplicate = await prisma.item.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      model: normalizedModel ? { equals: normalizedModel, mode: 'insensitive' } : { equals: null }
    }
  })
  if (duplicate) {
    throw createError({ statusCode: 409, statusMessage: 'ITEM_ALREADY_EXISTS' })
  }

  const trimmedSku = typeof body.sku === 'string' ? body.sku.trim() : ''
  const sku = trimmedSku || (await generateSku(prisma, { category_id: body.category_id, item_type: body.item_type }))

  if (trimmedSku) {
    const existing = await prisma.item.findFirst({ where: { sku: trimmedSku } })
    if (existing) {
      throw createError({ statusCode: 409, statusMessage: 'SKU_ALREADY_EXISTS' })
    }
  }

  const pricingMode = costSheetEntry ? 'COST_SHEET' : body.pricing_mode ?? 'MANUAL'
  const costSheetQuantity = costSheetEntry ? costSheetEntry.quantity : Number(body.cost_sheet_quantity ?? 0)
  const costSheetUnitCost = costSheetEntry
    ? toNumber(costSheetEntry.unit_cost) ?? 0
    : Number(body.cost_sheet_unit_cost ?? 0)
  let normalizedVatRate = costSheetEntry ? costSheetEntry.vat_rate : 0
  if (!costSheetEntry) {
    const vatSetting = await prisma.setting.findFirst({ where: { setting_key: 'tax_rate' } })
    const vatRate = Number(vatSetting?.setting_value ?? 0)
    normalizedVatRate = Number.isFinite(vatRate) ? vatRate : 0
  }
  const costSheetUnitPrice = costSheetUnitCost * (1 + normalizedVatRate)
  const costSheetTotalWithVat = costSheetUnitPrice
  const finalPrice = pricingMode === 'COST_SHEET' ? costSheetUnitPrice : body.price ?? 0
  const finalCost = pricingMode === 'COST_SHEET' ? costSheetUnitCost : body.cost ?? 0
  const shouldStoreCostSheetVatRate = Boolean(costSheetEntry) || costSheetQuantity > 0 || costSheetUnitCost > 0

  const item = await prisma.item.create({
    data: {
      item_id: body.item_id ?? createId(),
      name,
      model: normalizedModel,
      serial_number:
        typeof body.serial_number === 'string' && body.serial_number.trim()
          ? body.serial_number.trim()
          : null,
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
      sku,
      vendor_sku: typeof body.vendor_sku === 'string' && body.vendor_sku.trim() ? body.vendor_sku.trim() : null,
      barcode: body.barcode ?? null,
      weight: body.weight ?? null,
      dimensions: body.dimensions ?? null,
      manufacturer: body.manufacturer ?? null,
      warranty_period: body.warranty_period ?? null,
      unit:
        costSheetEntry?.unit ??
        (typeof body.unit === 'string' && body.unit.trim() ? body.unit.trim() : null),
      pricing_mode: pricingMode,
      margin_percent: body.margin_percent ?? null,
      price_override_reason:
        typeof body.price_override_reason === 'string' && body.price_override_reason.trim()
          ? body.price_override_reason.trim()
          : null,
      price_updated_at: new Date(),
      cost_sheet_quantity: costSheetQuantity > 0 ? costSheetQuantity : null,
      cost_sheet_unit_cost: costSheetUnitCost > 0 ? costSheetUnitCost : null,
      cost_sheet_total_with_vat: costSheetTotalWithVat > 0 ? costSheetTotalWithVat : null,
      cost_sheet_vat_rate: shouldStoreCostSheetVatRate ? normalizedVatRate : null,
      cost_sheet_entry_id: costSheetEntryId || null,
      created_by: user.user_id,
      sync_status: 'SYNCED'
    }
  })

  return mapItem(item)
})
