import type { Prisma } from '@prisma/client'

type DecimalLike = Prisma.Decimal | number

export const toNumber = (value: DecimalLike | null | undefined) => {
  if (value === null || value === undefined) {
    return null
  }
  return Number(value)
}

export const toIso = (value: Date | null | undefined) => {
  if (!value) {
    return null
  }
  return value.toISOString()
}
