import { createId } from '~/utils/id'
import { getPrismaClient } from '~/server/utils/prisma'
import { mapMaintenanceAttachment, mapMaintenanceTicket } from '~/server/utils/mappers'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const prisma = getPrismaClient()
  const user = await requireAuthUser(event)
  const ticketId = event.context.params?.ticketId
  if (!ticketId) {
    throw createError({ statusCode: 400, statusMessage: 'TICKET_ID_REQUIRED' })
  }

  const body = await readBody(event)
  const existing = await prisma.maintenanceTicket.findUnique({ where: { ticket_id: ticketId } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'TICKET_NOT_FOUND' })
  }
  const canEditEmployee = user.role === 'admin'
  const hasEmployee = Object.prototype.hasOwnProperty.call(body ?? {}, 'employee_name')
  const requestedEmployee = typeof body?.employee_name === 'string' ? body.employee_name.trim() : ''
  const nextEmployee =
    canEditEmployee && hasEmployee ? (requestedEmployee ? requestedEmployee : null) : existing.employee_name ?? null

  const nextStatus = body.status ?? existing.status
  const nextReceipt =
    typeof body.receipt_number === 'string' ? body.receipt_number.trim() : existing.receipt_number
  if (!nextReceipt) {
    throw createError({ statusCode: 400, statusMessage: 'RECEIPT_NUMBER_REQUIRED' })
  }

  const nextReceived = body.received_at ?? existing.received_at
  if (!nextReceived) {
    throw createError({ statusCode: 400, statusMessage: 'RECEIVED_DATE_REQUIRED' })
  }

  const nextDelivered = body.delivered_at ?? existing.delivered_at
  if (['COMPLETED', 'DELIVERED'].includes(String(nextStatus)) && !nextDelivered) {
    throw createError({ statusCode: 400, statusMessage: 'DELIVERED_DATE_REQUIRED' })
  }

  const attachmentUpdates: { receipt_attachment?: string | null } = {}
  if (Object.prototype.hasOwnProperty.call(body, 'receipt_attachment')) {
    attachmentUpdates.receipt_attachment =
      typeof body.receipt_attachment === 'string' && body.receipt_attachment.trim()
        ? body.receipt_attachment.trim()
        : null
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

  const result = await prisma.$transaction(async (tx) => {
    const ticket = await tx.maintenanceTicket.update({
      where: { ticket_id: ticketId },
      data: {
        ticket_number: body.ticket_number ?? undefined,
        receipt_number: nextReceipt,
        ...attachmentUpdates,
        technician_id: body.technician_id ?? undefined,
        employee_name: nextEmployee,
        status: nextStatus,
        problem_description: body.problem_description ?? undefined,
        diagnosis: body.diagnosis ?? undefined,
        estimated_cost: body.estimated_cost ?? undefined,
        estimated_completion: body.estimated_completion ? new Date(body.estimated_completion) : undefined,
        repair_cost: body.repair_cost ?? undefined,
        labor_cost: body.labor_cost ?? undefined,
        labor_hours: body.labor_hours ?? undefined,
        total_cost: body.total_cost ?? undefined,
        payment_status: body.payment_status ?? undefined,
        priority: body.priority ?? undefined,
        warranty_status: body.warranty_status ?? undefined,
        received_at: nextReceived ? new Date(nextReceived) : undefined,
        target_delivery_at: body.target_delivery_at ? new Date(body.target_delivery_at) : undefined,
        completed_at: body.completed_at ? new Date(body.completed_at) : undefined,
        delivered_at: nextDelivered ? new Date(nextDelivered) : undefined,
        updated_by: user.user_id,
        location_id: body.location_id ?? undefined,
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
