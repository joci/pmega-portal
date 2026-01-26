import { getPrismaClient } from '~/server/utils/prisma'
import { mapPayment, mapSale, mapSaleAttachment, mapSaleItem } from '~/server/utils/mappers'

export default defineEventHandler(async () => {
  const prisma = getPrismaClient()
  const [sales, saleItems, payments, attachments] = await prisma.$transaction([
    prisma.sale.findMany({ orderBy: { sale_date: 'desc' } }),
    prisma.saleItem.findMany({ orderBy: { created_at: 'desc' } }),
    prisma.payment.findMany({ orderBy: { payment_date: 'desc' } }),
    prisma.saleAttachment.findMany({ orderBy: { created_at: 'desc' } })
  ])

  return {
    sales: sales.map(mapSale),
    saleItems: saleItems.map(mapSaleItem),
    payments: payments.map(mapPayment),
    attachments: attachments.map(mapSaleAttachment)
  }
})
