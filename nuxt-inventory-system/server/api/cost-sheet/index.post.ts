import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapCostSheetEntry } from '~/server/utils/mappers'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  const itemName = typeof body?.item_name === 'string' ? body.item_name.trim() : ''
  if (!itemName) {
    throw createError({ statusCode: 400, statusMessage: 'ITEM_NAME_REQUIRED' })
  }

  const quantity = Number(body?.quantity ?? 0)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'QUANTITY_REQUIRED' })
  }

  const unitCost = Number(body?.unit_cost ?? 0)
  if (!Number.isFinite(unitCost) || unitCost < 0) {
    throw createError({ statusCode: 400, statusMessage: 'UNIT_COST_INVALID' })
  }

  const vatSetting = await prisma.setting.findFirst({ where: { setting_key: 'tax_rate' } })
  const vatRate = Number(vatSetting?.setting_value ?? 0)
  const normalizedVatRate = Number.isFinite(vatRate) ? vatRate : 0
  const totalWithVat = unitCost * (1 + normalizedVatRate)

  const entryDate =
    typeof body?.entry_date === 'string' && body.entry_date
      ? new Date(body.entry_date)
      : new Date()
  if (Number.isNaN(entryDate.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'ENTRY_DATE_INVALID' })
  }

  const entry = await prisma.costSheetEntry.create({
    data: {
      cost_sheet_id: body.cost_sheet_id ?? createId(),
      item_name: itemName,
      model: typeof body?.model === 'string' && body.model.trim() ? body.model.trim() : null,
      unit: typeof body?.unit === 'string' && body.unit.trim() ? body.unit.trim() : null,
      quantity,
      unit_cost: unitCost,
      total_with_vat: totalWithVat,
      vat_rate: normalizedVatRate,
      entry_date: entryDate,
      created_by: user.user_id,
      sync_status: 'SYNCED'
    },
    include: { item: true }
  })

  return mapCostSheetEntry(entry)
})
