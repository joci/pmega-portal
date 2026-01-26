import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapMaintenanceAttachment, mapMaintenanceTicket } from '~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const body = await readBody(event)

  if (!body?.customer_id || !body?.customer_device_id || !body?.location_id) {
    throw createError({ statusCode: 400, statusMessage: 'CUSTOMER_DEVICE_LOCATION_REQUIRED' })
  }
  if (!body?.problem_description || !body?.status || !body?.priority || !body?.warranty_status) {
    throw createError({ statusCode: 400, statusMessage: 'TICKET_FIELDS_REQUIRED' })
  }
  const receiptNumber = typeof body?.receipt_number === 'string' ? body.receipt_number.trim() : ''
  if (!receiptNumber) {
    throw createError({ statusCode: 400, statusMessage: 'RECEIPT_NUMBER_REQUIRED' })
  }

  const rawAttachments = Array.isArray(body?.attachments) ? body.attachments : []
  const attachments = rawAttachments
    .map((entry: Record<string, unknown>) => ({
      data_url: typeof entry.data_url === 'string' ? entry.data_url : '',
      file_name: typeof entry.file_name === 'string' ? entry.file_name : '',
      file_type: typeof entry.file_type === 'string' ? entry.file_type : '',
      file_size: Number(entry.file_size ?? 0)
    }))
    .filter((entry) => entry.data_url && entry.file_name)

  for (const attachment of attachments) {
    if (attachment.file_size > 5 * 1024 * 1024) {
      throw createError({ statusCode: 400, statusMessage: 'ATTACHMENT_TOO_LARGE' })
    }
  }
  if (!body?.received_at) {
    throw createError({ statusCode: 400, statusMessage: 'RECEIVED_DATE_REQUIRED' })
  }
  if (
    ['COMPLETED', 'DELIVERED'].includes(String(body.status)) &&
    !body?.delivered_at
  ) {
    throw createError({ statusCode: 400, statusMessage: 'DELIVERED_DATE_REQUIRED' })
  }

  const ticketId = body.ticket_id ?? createId()

  const result = await prisma.$transaction(async (tx) => {
    const ticket = await tx.maintenanceTicket.create({
      data: {
        ticket_id: ticketId,
        ticket_number: body.ticket_number ?? null,
        receipt_number: receiptNumber,
        receipt_attachment:
          typeof body.receipt_attachment === 'string' && body.receipt_attachment.trim()
            ? body.receipt_attachment.trim()
            : null,
        customer_id: body.customer_id,
        customer_device_id: body.customer_device_id,
        technician_id: body.technician_id ?? null,
        status: body.status,
        problem_description: body.problem_description,
        diagnosis: body.diagnosis ?? null,
        estimated_cost: body.estimated_cost ?? null,
        estimated_completion: body.estimated_completion ? new Date(body.estimated_completion) : null,
        repair_cost: body.repair_cost ?? null,
        labor_cost: body.labor_cost ?? null,
        labor_hours: body.labor_hours ?? null,
        total_cost: body.total_cost ?? null,
        payment_status: body.payment_status ?? null,
        priority: body.priority,
        warranty_status: body.warranty_status,
        received_at: body.received_at ? new Date(body.received_at) : new Date(),
        target_delivery_at: body.target_delivery_at ? new Date(body.target_delivery_at) : null,
        completed_at: body.completed_at ? new Date(body.completed_at) : null,
        delivered_at: body.delivered_at ? new Date(body.delivered_at) : null,
        created_by: body.created_by ?? null,
        updated_by: body.updated_by ?? null,
        location_id: body.location_id,
        sync_status: 'SYNCED'
      }
    })

    if (attachments.length > 0) {
      await tx.maintenanceAttachment.createMany({
        data: attachments.map((entry) => ({
          attachment_id: createId(),
          ticket_id: ticketId,
          file_name: entry.file_name,
          file_type: entry.file_type,
          file_size: entry.file_size,
          data_url: entry.data_url,
          sync_status: 'SYNCED'
        }))
      })
    }

    const createdAttachments = await tx.maintenanceAttachment.findMany({ where: { ticket_id: ticketId } })

    return { ticket, attachments: createdAttachments }
  })

  return {
    ticket: mapMaintenanceTicket(result.ticket),
    attachments: result.attachments.map(mapMaintenanceAttachment)
  }
})
