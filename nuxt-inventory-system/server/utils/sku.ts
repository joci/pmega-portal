import type { PrismaClient } from '@prisma/client'
import { createError } from 'h3'

const sanitizeSegment = (value: string, fallback: string) => {
  const cleaned = value.replace(/[^a-z0-9]/gi, '').toUpperCase()
  if (!cleaned) {
    return fallback
  }
  return cleaned.slice(0, 3)
}

const randomSuffix = () => Math.floor(100000 + Math.random() * 900000).toString()

export const generateSku = async (prisma: PrismaClient, input: { category_id?: string | null; item_type?: string }) => {
  let categorySegment = 'GEN'
  if (input.category_id) {
    const category = await prisma.category.findUnique({ where: { category_id: input.category_id } })
    if (category?.name) {
      categorySegment = sanitizeSegment(category.name, categorySegment)
    }
  } else if (input.item_type === 'SPARE_PART') {
    categorySegment = 'SPR'
  } else if (input.item_type === 'PRODUCT') {
    categorySegment = 'PRD'
  }

  const prefix = `OME-${categorySegment}`
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `${prefix}-${randomSuffix()}`
    const existing = await prisma.item.findFirst({ where: { sku: candidate } })
    if (!existing) {
      return candidate
    }
  }

  throw createError({ statusCode: 409, statusMessage: 'SKU_GENERATION_FAILED' })
}
