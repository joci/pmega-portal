import { getPrismaClient } from '~/server/utils/prisma'
import {
  mapCustomer,
  mapCustomerDevice,
  mapMaintenanceTicket,
  mapMaintenanceAttachment,
  mapPartRequest,
  mapPartUsage
} from '~/server/utils/mappers'

export default defineEventHandler(async () => {
  const prisma = getPrismaClient()
  const [tickets, requests, usage, customers, devices, attachments] = await prisma.$transaction([
    prisma.maintenanceTicket.findMany({ orderBy: { created_at: 'desc' } }),
    prisma.partRequest.findMany({ orderBy: { requested_at: 'desc' } }),
    prisma.partUsage.findMany({ orderBy: { used_at: 'desc' } }),
    prisma.customer.findMany({ orderBy: { created_at: 'desc' } }),
    prisma.customerDevice.findMany({ orderBy: { created_at: 'desc' } }),
    prisma.maintenanceAttachment.findMany({ orderBy: { created_at: 'desc' } })
  ])

  return {
    tickets: tickets.map(mapMaintenanceTicket),
    partRequests: requests.map(mapPartRequest),
    partUsage: usage.map(mapPartUsage),
    customers: customers.map(mapCustomer),
    customerDevices: devices.map(mapCustomerDevice),
    attachments: attachments.map(mapMaintenanceAttachment)
  }
})
