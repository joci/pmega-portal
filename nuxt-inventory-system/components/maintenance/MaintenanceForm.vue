<template>
  <div>
    <div v-if="!canViewMaintenance" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {{ t('permissions.noAccess') }}
    </div>

    <div v-else class="space-y-6">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">
            {{ editingTicketId ? t('maintenance.form.editTitle') : t('maintenance.form.title') }}
          </h2>
        </div>

        <div v-if="formMessage" class="mt-4">
          <UAlert :color="formMessage.type" :title="formMessage.text" />
        </div>

        <div v-if="!canEditMaintenance" class="mt-4 text-xs text-slate-500">
          {{ t('permissions.readOnly') }}
        </div>
        <div v-else-if="isTicketLocked" class="mt-4 text-xs text-slate-500">
          {{ t('maintenance.messages.ticketLocked') }}
        </div>

        <form class="mt-4 space-y-6" @submit.prevent="handleSubmit">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.customerName') }}</label>
              <input
                v-model="customerForm.name"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('maintenance.fields.customerNameAmharic') }}
              </label>
              <input
                v-model="customerForm.name_amharic"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.customerPhone') }}</label>
              <input
                v-model="customerForm.phone"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.customerTin') }}</label>
              <input
                v-model="customerForm.tin"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div class="grid gap-4">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('maintenance.fields.customerVatRegistration') }}
              </label>
              <input
                v-model="customerForm.vat_registration_no"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.itemName') }}</label>
              <input
                v-model="deviceForm.item_name"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.deviceModel') }}</label>
              <input
                v-model="deviceForm.model"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.serial') }}</label>
              <input
                v-model="deviceForm.serial_number"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.receiptNumber') }}</label>
              <input
                v-model="ticketForm.receipt_number"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('maintenance.fields.receiptAttachment') }}
              </label>
              <input
                v-model="ticketForm.receipt_attachment"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.employeeName') }}</label>
              <input
                v-model="ticketForm.employee_name"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                :disabled="!isAdmin"
                required
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.receivedDate') }}</label>
              <input
                v-model="ticketForm.received_at"
                type="date"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">
              {{ t('maintenance.fields.attachments') }}
            </label>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              class="mt-1 w-full text-sm"
              @change="handleAttachmentSelect"
            />
            <div v-if="attachmentErrors.length" class="mt-2 space-y-1 text-xs text-rose-600">
              <div v-for="message in attachmentErrors" :key="message">{{ message }}</div>
            </div>
            <div v-if="ticketExistingAttachments.length" class="mt-2 space-y-2">
              <div
                v-for="attachment in ticketExistingAttachments"
                :key="attachment.attachment_id"
                class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs"
              >
                <a
                  :href="attachment.data_url"
                  target="_blank"
                  rel="noopener"
                  class="text-slate-600 hover:text-emerald-600 hover:underline"
                >
                  {{ attachment.file_name }}
                </a>
                <button
                  v-if="canEditMaintenance && !isTicketLocked"
                  type="button"
                  class="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  @click="openAttachmentDelete(attachment)"
                >
                  {{ t('maintenance.actions.removeAttachment') }}
                </button>
              </div>
            </div>
            <div v-if="ticketAttachments.length" class="mt-2 space-y-2">
              <div
                v-for="attachment in ticketAttachments"
                :key="attachment.temp_id"
                class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs"
              >
                <div class="text-slate-600">
                  {{ attachment.file_name }}
                </div>
                <button
                  type="button"
                  class="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  @click="removeAttachment(attachment.temp_id)"
                >
                  {{ t('maintenance.actions.removeAttachment') }}
                </button>
              </div>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('maintenance.fields.targetDeliveryDate') }}
              </label>
              <input
                v-model="ticketForm.target_delivery_at"
                type="date"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('maintenance.fields.actualDeliveredDate') }}
              </label>
              <input
                v-model="ticketForm.delivered_at"
                type="date"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.priority') }}</label>
              <select
                v-model="ticketForm.priority"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="LOW">{{ t('maintenance.options.low') }}</option>
                <option value="MEDIUM">{{ t('maintenance.options.medium') }}</option>
                <option value="HIGH">{{ t('maintenance.options.high') }}</option>
                <option value="URGENT">{{ t('maintenance.options.urgent') }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.warranty') }}</label>
              <select
                v-model="ticketForm.warranty_status"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="IN_WARRANTY">{{ t('maintenance.options.inWarranty') }}</option>
                <option value="OUT_OF_WARRANTY">{{ t('maintenance.options.outWarranty') }}</option>
                <option value="EXTENDED">{{ t('maintenance.options.extended') }}</option>
              </select>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.location') }}</label>
              <select
                v-model="ticketForm.location_id"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">{{ t('maintenance.options.selectLocation') }}</option>
                <option
                  v-for="location in inventoryStore.locations"
                  :key="location.location_id"
                  :value="location.location_id"
                >
                  {{ location.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.technician') }}</label>
              <select
                v-model="ticketForm.technician_id"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">{{ t('maintenance.options.selectTechnician') }}</option>
                <option v-for="technician in technicians" :key="technician.user_id" :value="technician.user_id">
                  {{ technicianLabel(technician) }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.status') }}</label>
              <select
                v-model="ticketForm.status"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="PENDING">{{ t('maintenance.options.pending') }}</option>
                <option value="DIAGNOSIS">{{ t('maintenance.options.diagnosis') }}</option>
                <option value="WAITING_PARTS">{{ t('maintenance.options.waitingParts') }}</option>
                <option value="IN_PROGRESS">{{ t('maintenance.options.inProgress') }}</option>
                <option value="TESTING">{{ t('maintenance.options.testing') }}</option>
                <option value="COMPLETED">{{ t('maintenance.options.completed') }}</option>
                <option value="DELIVERED">{{ t('maintenance.options.delivered') }}</option>
                <option value="CANCELLED">{{ t('maintenance.options.cancelled') }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.fields.problem') }}</label>
            <textarea
              v-model="ticketForm.problem_description"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows="3"
              required
            />
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div class="text-xs font-semibold uppercase text-slate-500">{{ t('maintenance.totals.title') }}</div>
            <div class="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('maintenance.totals.parts') }}
                </label>
                <div class="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  {{ formatCurrency(totalPartsAmount) }}
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('maintenance.totals.labor') }}
                </label>
                <input
                  v-model.number="ticketForm.labor_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                />
              </div>
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('maintenance.totals.subtotal') }}
                </label>
                <div class="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  {{ formatCurrency(partsSubtotal) }}
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('maintenance.totals.vat') }} ({{ (vatRate * 100).toFixed(0) }}%)
                </label>
                <div class="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  {{ formatCurrency(vatAmount) }}
                </div>
              </div>
              <div class="md:col-span-2">
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('maintenance.totals.total') }}
                </label>
                <div class="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                  {{ formatCurrency(totalWithVat) }}
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <UButton
              type="submit"
              color="primary"
              :loading="isSubmitting"
              :disabled="isSubmitting || !canEditMaintenance || isTicketLocked"
            >
              {{ editingTicketId ? t('maintenance.actions.update') : t('maintenance.actions.save') }}
            </UButton>
            <UButton
              type="button"
              color="gray"
              variant="outline"
              @click="editingTicketId ? cancelEdit() : resetForm()"
            >
              {{ editingTicketId ? t('maintenance.actions.cancelEdit') : t('maintenance.actions.clear') }}
            </UButton>
          </div>
        </form>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-slate-900">{{ t('maintenance.parts.title') }}</h2>
          <UButton
            size="xs"
            color="primary"
            :disabled="!editingTicketId || !canRequestParts"
            @click="openPartRequestModal"
          >
            {{ t('maintenance.parts.requestButton') }}
          </UButton>
        </div>
        <div v-if="partRequestNotice" class="mt-4">
          <UAlert :color="partRequestNotice.type" :title="partRequestNotice.text" />
        </div>
        <div v-if="!editingTicketId" class="mt-4 text-sm text-slate-500">
          {{ t('maintenance.partRequest.selectTicket') }}
        </div>
        <div v-else class="mt-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h3 class="text-base font-semibold text-slate-900">{{ t('maintenance.parts.listTitleTicket') }}</h3>
            <NuxtLink :to="localePath({ path: '/maintenance/parts', query: { ticket: editingTicketId } })">
              <UButton size="xs" color="gray" variant="outline">{{ t('maintenance.parts.viewAll') }}</UButton>
            </NuxtLink>
          </div>
          <div v-if="ticketPartRequests.length === 0" class="mt-3 text-sm text-slate-500">
            {{ t('maintenance.parts.emptyTicket') }}
          </div>
          <div v-else class="mt-3 overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="text-left text-xs font-semibold uppercase text-slate-500">
                <tr class="border-b border-slate-200">
                  <th class="py-2 pr-4">{{ t('maintenance.parts.columns.item') }}</th>
                  <th class="py-2 pr-4">{{ t('maintenance.parts.columns.source') }}</th>
                  <th class="py-2 pr-4">{{ t('maintenance.parts.columns.quantity') }}</th>
                  <th class="py-2 pr-4">{{ t('maintenance.parts.columns.unitPrice') }}</th>
                  <th class="py-2 pr-4">{{ t('maintenance.parts.columns.lineTotal') }}</th>
                  <th class="py-2 pr-4">{{ t('maintenance.parts.columns.status') }}</th>
                  <th class="py-2 pr-4">{{ t('maintenance.parts.columns.requestedBy') }}</th>
                  <th class="py-2 pr-4">{{ t('maintenance.parts.columns.requestedAt') }}</th>
                  <th class="py-2 pr-4">{{ t('maintenance.parts.columns.receipt') }}</th>
                  <th class="py-2 pr-4">{{ t('maintenance.parts.columns.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="request in ticketPartRequests" :key="request.request_id" class="border-b border-slate-100">
                  <td class="py-3 pr-4">
                    <div class="font-semibold text-slate-900">{{ partName(request) }}</div>
                    <div v-if="partModel(request)" class="text-xs text-slate-500">{{ partModel(request) }}</div>
                  </td>
                  <td class="py-3 pr-4 text-sm text-slate-700">
                    {{ sourceLabel(request.source_preference) }}
                  </td>
                  <td class="py-3 pr-4 text-sm text-slate-700">{{ request.quantity_requested }}</td>
                  <td class="py-3 pr-4 text-sm text-slate-700">
                    {{ formatAmount(unitAmount(request)) }}
                  </td>
                  <td class="py-3 pr-4 text-sm text-slate-700">
                    {{ formatAmount(lineTotal(request)) }}
                  </td>
                  <td class="py-3 pr-4 text-sm text-slate-700">
                    <select
                      v-if="canApproveParts"
                      class="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                      :value="request.status"
                      @change="handleStatusChange(request, $event)"
                    >
                      <option value="REQUESTED">{{ t('maintenance.partRequest.statusRequested') }}</option>
                      <option value="APPROVED">{{ t('maintenance.partRequest.statusApproved') }}</option>
                      <option value="REJECTED">{{ t('maintenance.partRequest.statusRejected') }}</option>
                      <option value="FULFILLED">{{ t('maintenance.partRequest.statusFulfilled') }}</option>
                      <option value="CANCELLED">{{ t('maintenance.partRequest.statusCancelled') }}</option>
                    </select>
                    <span v-else>{{ request.status }}</span>
                  </td>
                  <td class="py-3 pr-4 text-sm text-slate-700">{{ request.requested_by }}</td>
                  <td class="py-3 pr-4 text-sm text-slate-700">
                    {{ formatDate(request.requested_at) }}
                  </td>
                  <td class="py-3 pr-4 text-sm text-slate-700">
                    {{ request.external_receipt_number || '-' }}
                  </td>
                  <td class="py-3 pr-4 text-sm text-slate-700">
                    <button
                      v-if="canManagePartRequests"
                      type="button"
                      class="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      @click="confirmDelete(request)"
                    >
                      {{ t('maintenance.parts.actions.delete') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="mt-4 flex justify-end">
              <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-right">
                <div class="text-[11px] font-semibold uppercase text-slate-500">
                  {{ t('maintenance.parts.totalLabel') }}
                </div>
                <div class="text-base font-semibold text-slate-900">
                  {{ formatCurrency(totalPartsAmount) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UModal v-model:open="isPartRequestModalOpen" portal="body">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-slate-900">{{ t('maintenance.partRequest.title') }}</div>
                <div class="text-xs text-slate-500">
                  {{
                    editingTicketId
                      ? `${t('maintenance.parts.ticketReceipt')}: ${ticketForm.receipt_number || editingTicketId}`
                      : t('maintenance.partRequest.selectTicket')
                  }}
                </div>
              </div>
              <UButton size="xs" color="gray" variant="outline" @click="isPartRequestModalOpen = false">
                {{ t('maintenance.partRequest.close') }}
              </UButton>
            </div>
          </template>

          <div v-if="partRequestMessage" class="mb-4">
            <UAlert :color="partRequestMessage.type" :title="partRequestMessage.text" />
          </div>

          <div
            class="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
          >
            <button
              type="button"
              class="rounded-full px-3 py-1"
              :class="partRequestMode === 'internal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
              @click="partRequestMode = 'internal'"
            >
              {{ t('maintenance.partRequest.tabs.internal') }}
            </button>
            <button
              type="button"
              class="rounded-full px-3 py-1"
              :class="partRequestMode === 'external' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
              @click="partRequestMode = 'external'"
            >
              {{ t('maintenance.partRequest.tabs.external') }}
            </button>
          </div>

          <form class="mt-4 space-y-4" @submit.prevent="submitPartRequest">
            <div v-if="partRequestMode === 'internal'" class="space-y-4">
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">{{
                  t('maintenance.partRequest.part')
                }}</label>
                <div class="relative mt-1">
                  <input
                    v-model="partRequestForm.part_query"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    :placeholder="t('maintenance.partRequest.selectPart')"
                    @focus="openPartMenu"
                    @input="handlePartInput"
                    @keydown.enter.prevent="selectFirstPartMatch"
                    @keydown.escape="closePartMenu"
                    @blur="scheduleClosePartMenu"
                  />
                  <div
                    v-if="isPartMenuOpen"
                    class="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                  >
                    <div v-if="filteredParts.length === 0" class="px-3 py-2 text-xs text-slate-500">
                      {{ t('maintenance.partRequest.noPartMatches') }}
                    </div>
                    <div v-else class="max-h-64 overflow-auto">
                      <button
                        v-for="item in filteredParts"
                        :key="item.item_id"
                        type="button"
                        class="flex w-full flex-col gap-1 px-3 py-2 text-left text-sm hover:bg-slate-50"
                        @mousedown.prevent="selectPart(item)"
                      >
                        <span class="font-semibold text-slate-900">{{ partLabel(item) }}</span>
                        <span class="text-xs text-slate-500">{{ formatCurrency(Number(item.price ?? 0)) }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="grid gap-4 md:grid-cols-3">
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.partRequest.quantity') }}
                  </label>
                  <input
                    v-model.number="partRequestForm.quantity_requested"
                    type="number"
                    min="1"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.partRequest.requestedBy') }}
                  </label>
                  <input
                    v-model="partRequestForm.requested_by"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.fields.technician') }}
                  </label>
                  <select
                    v-model="partRequestForm.technician_id"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">{{ t('maintenance.options.selectTechnician') }}</option>
                    <option v-for="technician in technicians" :key="technician.user_id" :value="technician.user_id">
                      {{ technicianLabel(technician) }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.partRequest.inventoryPrice') }}
                  </label>
                  <div
                    class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    {{ selectedPartPrice }}
                  </div>
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.partRequest.lineTotal') }}
                  </label>
                  <div
                    class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    {{ selectedPartLineTotal }}
                  </div>
                </div>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.partRequest.source') }}
                  </label>
                  <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {{ t('maintenance.partRequest.sourceStore') }}
                  </div>
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.partRequest.status') }}
                  </label>
                    <select
                      v-model="partRequestForm.status"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      :disabled="!canApproveParts"
                    >
                    <option value="REQUESTED">{{ t('maintenance.partRequest.statusRequested') }}</option>
                    <option value="APPROVED">{{ t('maintenance.partRequest.statusApproved') }}</option>
                    <option value="REJECTED">{{ t('maintenance.partRequest.statusRejected') }}</option>
                    <option value="FULFILLED">{{ t('maintenance.partRequest.statusFulfilled') }}</option>
                    <option value="CANCELLED">{{ t('maintenance.partRequest.statusCancelled') }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div v-else class="space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.partRequest.externalItemName') }}
                  </label>
                  <input
                    v-model="partRequestForm.external_item_name"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.partRequest.externalModel') }}
                  </label>
                  <input
                    v-model="partRequestForm.external_model"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.partRequest.receiptNumber') }}
                  </label>
                  <input
                    v-model="partRequestForm.external_receipt_number"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.partRequest.externalCost') }}
                  </label>
                  <input
                    v-model.number="partRequestForm.external_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              <div class="grid gap-4 md:grid-cols-3">
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.partRequest.quantity') }}
                  </label>
                  <input
                    v-model.number="partRequestForm.quantity_requested"
                    type="number"
                    min="1"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.partRequest.requestedBy') }}
                  </label>
                  <input
                    v-model="partRequestForm.requested_by"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.fields.technician') }}
                  </label>
                  <select
                    v-model="partRequestForm.technician_id"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">{{ t('maintenance.options.selectTechnician') }}</option>
                    <option v-for="technician in technicians" :key="technician.user_id" :value="technician.user_id">
                      {{ technicianLabel(technician) }}
                    </option>
                  </select>
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('maintenance.partRequest.lineTotal') }}
                </label>
                <div class="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {{ externalLineTotal }}
                </div>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.partRequest.status') }}
                  </label>
                    <select
                      v-model="partRequestForm.status"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      :disabled="!canApproveParts"
                    >
                    <option value="REQUESTED">{{ t('maintenance.partRequest.statusRequested') }}</option>
                    <option value="APPROVED">{{ t('maintenance.partRequest.statusApproved') }}</option>
                    <option value="REJECTED">{{ t('maintenance.partRequest.statusRejected') }}</option>
                    <option value="FULFILLED">{{ t('maintenance.partRequest.statusFulfilled') }}</option>
                    <option value="CANCELLED">{{ t('maintenance.partRequest.statusCancelled') }}</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('maintenance.partRequest.receiptAttachment') }}
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    @change="handleExternalReceipt"
                  />
                  <div class="mt-1 text-xs text-slate-500">
                    {{ t('maintenance.partRequest.receiptAttachmentHelper') }}
                  </div>
                  <div v-if="partRequestForm.external_receipt_file_name" class="mt-2 flex items-center gap-2 text-xs">
                    <span class="text-slate-600">
                      {{ t('maintenance.partRequest.receiptSelected') }}: {{ partRequestForm.external_receipt_file_name }}
                    </span>
                    <UButton size="xs" color="gray" variant="outline" @click="clearExternalReceipt">
                      {{ t('maintenance.partRequest.receiptClear') }}
                    </UButton>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('maintenance.partRequest.notes') }}
              </label>
              <textarea
                v-model="partRequestForm.notes"
                rows="2"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div class="flex flex-wrap gap-3">
              <UButton
                type="submit"
                color="primary"
                :loading="isSubmittingPartRequest"
                :disabled="isSubmittingPartRequest || !canRequestParts"
              >
                {{ t('maintenance.partRequest.submit') }}
              </UButton>
              <UButton type="button" color="gray" variant="outline" @click="resetPartRequestForm">
                {{ t('maintenance.partRequest.clear') }}
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>

    <UModal v-model:open="isAttachmentDeleteOpen" portal="body">
      <template #content>
        <UCard>
          <template #header>
            <div class="text-sm font-semibold text-slate-900">{{ t('maintenance.attachments.deleteTitle') }}</div>
          </template>
          <div class="text-sm text-slate-600">
            {{ t('maintenance.attachments.deleteDescription', { name: attachmentToDelete?.file_name || '' }) }}
          </div>
          <template #footer>
            <div class="flex flex-wrap gap-3">
              <UButton color="red" @click="confirmAttachmentDelete">
                {{ t('maintenance.attachments.deleteConfirm') }}
              </UButton>
              <UButton color="gray" variant="outline" @click="closeAttachmentDelete">
                {{ t('maintenance.attachments.deleteCancel') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { useMaintenanceStore } from '~/stores/maintenance'
import { useSettingsStore } from '~/stores/settings'
import { usePermissions } from '~/composables/usePermissions'
import { useAuth } from '~/composables/useAuth'
import type { Item, MaintenanceAttachment, MaintenanceTicket, PartRequest } from '~/types/database'
import { useFlashMessage } from '~/composables/useFlashMessage'
import { createId } from '~/utils/id'

const store = useMaintenanceStore()
const inventoryStore = useInventoryStore()
const settingsStore = useSettingsStore()
const { can, loadPermissions } = usePermissions()
const { user } = useAuth()
const { locale, t } = useI18n()
const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { setFlashMessage } = useFlashMessage()

const canViewMaintenance = computed(() => can('maintenance.view'))
const canEditMaintenance = computed(() => can('maintenance.edit'))
const canRequestParts = computed(() => can('maintenance.parts.request'))
const canApproveParts = computed(() => user.value?.role === 'admin' || user.value?.role === 'manager')
const canManagePartRequests = computed(() => user.value?.role === 'admin' || user.value?.role === 'manager')
const isAdmin = computed(() => user.value?.role === 'admin')
const defaultRequestedBy = computed(() => {
  if (user.value?.name) {
    return user.value.name
  }
  if (user.value?.username) {
    return user.value.username
  }
  return user.value?.email ?? ''
})
const defaultEmployeeName = computed(() => user.value?.name || user.value?.username || user.value?.email || '')
const isTicketLocked = computed(
  () => !!editingTicketId.value && ['COMPLETED', 'DELIVERED'].includes(ticketForm.status)
)

type TechnicianOption = {
  user_id: string
  name: string | null
  username: string
  email: string
}

type TicketAttachmentDraft = {
  temp_id: string
  file_name: string
  file_type: string
  file_size: number
  data_url: string
}

const customerForm = reactive({
  name: '',
  name_amharic: '',
  phone: '',
  email: '',
  tin: '',
  vat_registration_no: ''
})

const deviceForm = reactive({
  item_name: '',
  brand: '',
  model: '',
  serial_number: ''
})

const ticketForm = reactive({
  receipt_number: '',
  receipt_attachment: '',
  received_at: new Date().toISOString().slice(0, 10),
  target_delivery_at: '',
  delivered_at: '',
  technician_id: '',
  employee_name: '',
  labor_cost: 0,
  problem_description: '',
  priority: 'MEDIUM' as const,
  warranty_status: 'OUT_OF_WARRANTY' as const,
  status: 'PENDING' as const,
  location_id: ''
})

const formMessage = ref<{ type: 'primary' | 'red'; text: string } | null>(null)
const attachmentErrors = ref<string[]>([])
const ticketAttachments = ref<TicketAttachmentDraft[]>([])
const isAttachmentDeleteOpen = ref(false)
const attachmentToDelete = ref<MaintenanceAttachment | null>(null)
const editingTicketId = ref<string | null>(null)
const editingCustomerId = ref<string | null>(null)
const editingDeviceId = ref<string | null>(null)
const technicians = ref<TechnicianOption[]>([])
const { isSubmitting, runWithLock } = useSubmitLock()
const { isSubmitting: isSubmittingPartRequest, runWithLock: withPartRequestLock } = useSubmitLock()
const partRequestForm = reactive({
  part_id: '',
  part_query: '',
  quantity_requested: 1,
  requested_by: '',
  technician_id: '',
  source_preference: 'STORE_INVENTORY' as const,
  status: 'REQUESTED' as const,
  notes: '',
  external_item_name: '',
  external_model: '',
  external_cost: 0,
  external_receipt_number: '',
  external_receipt_data_url: '',
  external_receipt_file_name: '',
  external_receipt_file_type: '',
  external_receipt_file_size: 0
})

watch(
  defaultRequestedBy,
  (value) => {
    if (!partRequestForm.requested_by) {
      partRequestForm.requested_by = value
    }
  },
  { immediate: true }
)

watch(
  defaultEmployeeName,
  (value) => {
    if (!ticketForm.employee_name) {
      ticketForm.employee_name = value
    }
  },
  { immediate: true }
)

const partRequestMode = ref<'internal' | 'external'>('internal')
const partRequestMessage = ref<{ type: 'primary' | 'red'; text: string } | null>(null)
const partRequestNotice = ref<{ type: 'primary' | 'red'; text: string } | null>(null)
const isPartRequestModalOpen = ref(false)
const isPartMenuOpen = ref(false)
const maxPartMatches = 12

const prefillTicketId = computed(() => (typeof route.query.ticket === 'string' ? route.query.ticket : ''))
const ticketPartRequests = computed(() =>
  editingTicketId.value
    ? store.partRequests.filter((entry) => entry.ticket_id === editingTicketId.value)
    : []
)
const ticketExistingAttachments = computed(() =>
  editingTicketId.value ? store.attachments.filter((entry) => entry.ticket_id === editingTicketId.value) : []
)
const itemsById = computed(() => new Map(inventoryStore.items.map((entry) => [entry.item_id, entry])))
const technicianLabel = (technician: TechnicianOption) => {
  return technician.name || technician.username || technician.email || technician.user_id
}

const partName = (request: PartRequest) => {
  if (request.part_id) {
    return inventoryStore.items.find((item) => item.item_id === request.part_id)?.name ?? '-'
  }
  return request.external_item_name ?? '-'
}

const partModel = (request: PartRequest) => {
  if (request.part_id) {
    const item = inventoryStore.items.find((entry) => entry.item_id === request.part_id)
    return item?.model ?? ''
  }
  return request.external_model ?? ''
}

const selectedPartUnitAmount = computed(() => {
  if (!partRequestForm.part_id) {
    return null
  }
  const item = itemsById.value.get(partRequestForm.part_id)
  if (!item || item.price == null) {
    return null
  }
  const value = Number(item.price)
  return Number.isNaN(value) ? null : value
})

const selectedPartPrice = computed(() => formatAmount(selectedPartUnitAmount.value))

const selectedPartLineTotal = computed(() => {
  if (selectedPartUnitAmount.value == null || partRequestForm.quantity_requested <= 0) {
    return '-'
  }
  return formatCurrency(selectedPartUnitAmount.value * partRequestForm.quantity_requested)
})

const externalLineTotal = computed(() => {
  if (partRequestForm.external_cost <= 0 || partRequestForm.quantity_requested <= 0) {
    return '-'
  }
  return formatCurrency(partRequestForm.external_cost * partRequestForm.quantity_requested)
})

const partLabel = (item: Item) => {
  const base = [item.name, item.model].filter(Boolean).join(' • ')
  const sku = item.sku ? ` (${item.sku})` : ''
  return `${base}${sku}`.trim()
}

const partSearchText = (item: Item) => {
  return [item.name, item.model, item.sku, item.vendor_sku, item.barcode].filter(Boolean).join(' ').toLowerCase()
}

const sortedParts = computed(() => {
  return [...inventoryStore.items].sort((a, b) => partLabel(a).localeCompare(partLabel(b)))
})

const filteredParts = computed(() => {
  const query = partRequestForm.part_query.trim().toLowerCase()
  if (!query) {
    return sortedParts.value.slice(0, maxPartMatches)
  }
  return sortedParts.value.filter((item) => partSearchText(item).includes(query)).slice(0, maxPartMatches)
})

const unitAmount = (request: PartRequest) => {
  if (request.part_id) {
    const item = inventoryStore.items.find((entry) => entry.item_id === request.part_id)
    if (item?.price != null) {
      const value = Number(item.price)
      return Number.isNaN(value) ? null : value
    }
  }
  if (request.external_cost != null) {
    const value = Number(request.external_cost)
    return Number.isNaN(value) ? null : value
  }
  return null
}

const lineTotal = (request: PartRequest) => {
  const unit = unitAmount(request)
  if (unit == null) {
    return null
  }
  return unit * request.quantity_requested
}

const formatAmount = (value: number | null) => {
  if (value == null) {
    return '-'
  }
  return formatCurrency(value)
}

const totalPartsAmount = computed(() =>
  ticketPartRequests.value.reduce((sum, request) => {
    const total = lineTotal(request)
    return sum + (total ?? 0)
  }, 0)
)

const vatRate = computed(() => {
  const raw = settingsStore.getSetting('tax_rate')?.setting_value ?? '0'
  const value = Number(raw)
  return Number.isNaN(value) ? 0 : value
})

const laborCostValue = computed(() => {
  const value = Number(ticketForm.labor_cost || 0)
  return Number.isNaN(value) ? 0 : Math.max(0, value)
})

const partsSubtotal = computed(() => totalPartsAmount.value + laborCostValue.value)

const vatAmount = computed(() => partsSubtotal.value * vatRate.value)

const totalWithVat = computed(() => partsSubtotal.value + vatAmount.value)

const sourceLabel = (source: PartRequest['source_preference']) => {
  switch (source) {
    case 'EXTERNAL_SUPPLIER':
      return t('maintenance.partRequest.sourceExternal')
    case 'CUSTOMER_SUPPLIED':
      return t('maintenance.partRequest.sourceCustomer')
    case 'STORE_INVENTORY':
    default:
      return t('maintenance.partRequest.sourceStore')
  }
}

const loadTechnicians = async () => {
  try {
    const response = await $fetch<{ technicians: TechnicianOption[] }>('/api/users/technicians')
    technicians.value = response.technicians ?? []
  } catch (error) {
    console.warn('Failed to load technicians', error)
  }
}

const clearEditQuery = async () => {
  if (prefillTicketId.value) {
    await router.replace(localePath('/maintenance/new'))
  }
}

const resetForm = async () => {
  customerForm.name = ''
  customerForm.name_amharic = ''
  customerForm.phone = ''
  customerForm.email = ''
  customerForm.tin = ''
  customerForm.vat_registration_no = ''
  deviceForm.item_name = ''
  deviceForm.brand = ''
  deviceForm.model = ''
  deviceForm.serial_number = ''
  ticketForm.receipt_number = ''
  ticketForm.receipt_attachment = ''
  ticketForm.received_at = new Date().toISOString().slice(0, 10)
  ticketForm.target_delivery_at = ''
  ticketForm.delivered_at = ''
  ticketForm.technician_id = ''
  ticketForm.employee_name = defaultEmployeeName.value
  ticketForm.labor_cost = 0
  ticketForm.problem_description = ''
  ticketForm.priority = 'MEDIUM'
  ticketForm.warranty_status = 'OUT_OF_WARRANTY'
  ticketForm.status = 'PENDING'
  ticketForm.location_id = ''
  formMessage.value = null
  attachmentErrors.value = []
  ticketAttachments.value = []
  editingTicketId.value = null
  editingCustomerId.value = null
  editingDeviceId.value = null
  await clearEditQuery()
}

const resetPartRequestForm = () => {
  partRequestForm.part_id = ''
  partRequestForm.part_query = ''
  partRequestForm.quantity_requested = 1
  partRequestForm.requested_by = defaultRequestedBy.value
  partRequestForm.technician_id = ticketForm.technician_id || ''
  partRequestForm.source_preference = 'STORE_INVENTORY'
  partRequestForm.status = 'REQUESTED'
  partRequestForm.notes = ''
  partRequestForm.external_item_name = ''
  partRequestForm.external_model = ''
  partRequestForm.external_cost = 0
  partRequestForm.external_receipt_number = ''
  partRequestForm.external_receipt_data_url = ''
  partRequestForm.external_receipt_file_name = ''
  partRequestForm.external_receipt_file_type = ''
  partRequestForm.external_receipt_file_size = 0
  partRequestMode.value = 'internal'
  partRequestMessage.value = null
  isPartMenuOpen.value = false
}

const openPartRequestModal = () => {
  if (!editingTicketId.value) {
    return
  }
  resetPartRequestForm()
  isPartRequestModalOpen.value = true
}

const handleExternalReceipt = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    partRequestForm.external_receipt_data_url = ''
    partRequestForm.external_receipt_file_name = ''
    partRequestForm.external_receipt_file_type = ''
    partRequestForm.external_receipt_file_size = 0
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    partRequestMessage.value = { type: 'red', text: t('maintenance.partRequest.receiptTooLarge') }
    input.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    partRequestForm.external_receipt_data_url = String(reader.result ?? '')
    partRequestForm.external_receipt_file_name = file.name
    partRequestForm.external_receipt_file_type = file.type
    partRequestForm.external_receipt_file_size = file.size
  }
  reader.readAsDataURL(file)
}

const clearExternalReceipt = () => {
  partRequestForm.external_receipt_data_url = ''
  partRequestForm.external_receipt_file_name = ''
  partRequestForm.external_receipt_file_type = ''
  partRequestForm.external_receipt_file_size = 0
}

const handleAttachmentSelect = async (event: Event) => {
  // TODO: Replace data URL storage with Supabase Storage uploads before production.
  const input = event.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  attachmentErrors.value = []

  if (!files.length) {
    return
  }

  const nextAttachments: TicketAttachmentDraft[] = []

  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      attachmentErrors.value.push(t('maintenance.messages.attachmentTooLarge', { name: file.name }))
      continue
    }
    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
    nextAttachments.push({
      temp_id: createId(),
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      data_url: dataUrl
    })
  }

  if (nextAttachments.length) {
    ticketAttachments.value = [...ticketAttachments.value, ...nextAttachments]
  }

  input.value = ''
}

const removeAttachment = (tempId: string) => {
  ticketAttachments.value = ticketAttachments.value.filter((entry) => entry.temp_id !== tempId)
}

const openAttachmentDelete = (attachment: MaintenanceAttachment) => {
  attachmentToDelete.value = attachment
  isAttachmentDeleteOpen.value = true
}

const closeAttachmentDelete = () => {
  attachmentToDelete.value = null
  isAttachmentDeleteOpen.value = false
}

const confirmAttachmentDelete = async () => {
  if (!canEditMaintenance.value || isTicketLocked.value) {
    return
  }
  if (!attachmentToDelete.value) {
    closeAttachmentDelete()
    return
  }
  try {
    await store.deleteAttachment(attachmentToDelete.value.attachment_id)
    closeAttachmentDelete()
  } catch (error) {
    console.error(error)
    formMessage.value = { type: 'red', text: t('maintenance.messages.attachmentDeleteFailed') }
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'ETB' }).format(value || 0)
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleDateString(locale.value)
}

const openPartMenu = () => {
  isPartMenuOpen.value = true
}

const closePartMenu = () => {
  isPartMenuOpen.value = false
}

const scheduleClosePartMenu = () => {
  if (!process.client) {
    return
  }
  window.setTimeout(() => {
    isPartMenuOpen.value = false
  }, 150)
}

const handlePartInput = () => {
  openPartMenu()
  const query = partRequestForm.part_query.trim()
  if (!query) {
    partRequestForm.part_id = ''
    return
  }
  const item = partRequestForm.part_id ? itemsById.value.get(partRequestForm.part_id) : null
  if (item && partLabel(item).toLowerCase() !== query.toLowerCase()) {
    partRequestForm.part_id = ''
  }
}

const selectPart = (item: Item) => {
  partRequestForm.part_id = item.item_id
  partRequestForm.part_query = partLabel(item)
  isPartMenuOpen.value = false
}

const selectFirstPartMatch = () => {
  if (!partRequestForm.part_query.trim()) {
    return
  }
  if (filteredParts.value.length > 0) {
    selectPart(filteredParts.value[0])
  }
}

const syncPartQuery = () => {
  if (!partRequestForm.part_id) {
    return
  }
  const item = itemsById.value.get(partRequestForm.part_id)
  if (!item) {
    return
  }
  const label = partLabel(item)
  if (!partRequestForm.part_query || partRequestForm.part_query.toLowerCase() !== label.toLowerCase()) {
    partRequestForm.part_query = label
  }
}

const handleSubmit = async () => {
  await runWithLock(async () => {
    formMessage.value = null
    if (!canEditMaintenance.value) {
      formMessage.value = { type: 'red', text: t('permissions.readOnly') }
      return
    }
    if (isTicketLocked.value) {
      formMessage.value = { type: 'red', text: t('maintenance.messages.ticketLocked') }
      return
    }
    if (!customerForm.name.trim()) {
      formMessage.value = { type: 'red', text: t('maintenance.messages.customerRequired') }
      return
    }
    if (!deviceForm.item_name.trim() || !deviceForm.model.trim()) {
      formMessage.value = { type: 'red', text: t('maintenance.messages.deviceRequired') }
      return
    }
    if (!ticketForm.receipt_number.trim()) {
      formMessage.value = { type: 'red', text: t('maintenance.messages.receiptRequired') }
      return
    }
    if (!ticketForm.employee_name.trim()) {
      formMessage.value = { type: 'red', text: t('maintenance.messages.employeeRequired') }
      return
    }
    if (!ticketForm.received_at) {
      formMessage.value = { type: 'red', text: t('maintenance.messages.receivedDateRequired') }
      return
    }
    if (!ticketForm.location_id) {
      formMessage.value = { type: 'red', text: t('maintenance.messages.locationRequired') }
      return
    }
    if (['COMPLETED', 'DELIVERED'].includes(ticketForm.status) && !ticketForm.delivered_at) {
      formMessage.value = { type: 'red', text: t('maintenance.messages.deliveredDateRequired') }
      return
    }

    const wasEditing = Boolean(editingTicketId.value)

    try {
      let customerId = editingCustomerId.value
      let deviceId = editingDeviceId.value

      if (editingTicketId.value && customerId && deviceId) {
        await store.updateCustomer({
          customer_id: customerId,
          name: customerForm.name,
          name_amharic: customerForm.name_amharic || null,
          phone: customerForm.phone || null,
          email: customerForm.email || null,
          tin: customerForm.tin || null,
          vat_registration_no: customerForm.vat_registration_no || null,
          address_id: null,
          customer_type: 'MAINTENANCE'
        })
        await store.updateCustomerDevice({
          device_id: deviceId,
          customer_id: customerId,
          catalog_item_id: null,
          item_name: deviceForm.item_name || null,
          brand: deviceForm.brand || null,
          model: deviceForm.model || null,
          serial_number: deviceForm.serial_number || null,
          purchase_date: null,
          warranty_expiry: null,
          notes: null
        })
      } else {
        customerId = await store.createCustomer({
          name: customerForm.name,
          name_amharic: customerForm.name_amharic || null,
          phone: customerForm.phone || null,
          email: customerForm.email || null,
          tin: customerForm.tin || null,
          vat_registration_no: customerForm.vat_registration_no || null,
          customer_type: 'MAINTENANCE'
        })

        deviceId = await store.createCustomerDevice({
          customer_id: customerId,
          item_name: deviceForm.item_name || null,
          brand: deviceForm.brand || null,
          model: deviceForm.model,
          serial_number: deviceForm.serial_number || null
        })
      }

      const ticketPayload = {
        ticket_id: editingTicketId.value || undefined,
        ticket_number: null,
        receipt_number: ticketForm.receipt_number,
        receipt_attachment: ticketForm.receipt_attachment || null,
        customer_id: customerId,
        customer_device_id: deviceId,
        technician_id: ticketForm.technician_id || null,
        employee_name: ticketForm.employee_name.trim(),
        status: ticketForm.status,
        problem_description: ticketForm.problem_description,
        diagnosis: null,
        estimated_cost: null,
        estimated_completion: null,
        repair_cost: null,
        labor_cost: laborCostValue.value,
        labor_hours: null,
        total_cost: totalWithVat.value,
        payment_status: 'PENDING',
        priority: ticketForm.priority,
        warranty_status: ticketForm.warranty_status,
        received_at: ticketForm.received_at,
        target_delivery_at: ticketForm.target_delivery_at || null,
        delivered_at: ticketForm.delivered_at || null,
        location_id: ticketForm.location_id
      }

      const attachmentsPayload: MaintenanceAttachment[] = ticketAttachments.value.map((attachment) => ({
        attachment_id: '',
        ticket_id: editingTicketId.value || '',
        file_name: attachment.file_name,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
        data_url: attachment.data_url
      }))

      if (editingTicketId.value) {
        await store.updateTicket(
          {
            ...ticketPayload,
            ticket_id: editingTicketId.value
          },
          attachmentsPayload
        )
      } else {
        await store.createTicket(ticketPayload, attachmentsPayload)
      }

      const message = wasEditing ? t('maintenance.messages.updated') : t('maintenance.messages.saved')
      setFlashMessage({ type: 'primary', text: message })
      await router.push(localePath('/maintenance'))
    } catch (error: any) {
      const statusMessage = error?.data?.statusMessage || error?.response?.statusMessage
      if (statusMessage === 'ATTACHMENT_TOO_LARGE') {
        formMessage.value = { type: 'red', text: t('maintenance.messages.attachmentTooLarge', { name: '' }) }
        return
      }
      if (statusMessage === 'RECEIPT_NUMBER_REQUIRED') {
        formMessage.value = { type: 'red', text: t('maintenance.messages.receiptRequired') }
        return
      }
      if (statusMessage === 'RECEIVED_DATE_REQUIRED') {
        formMessage.value = { type: 'red', text: t('maintenance.messages.receivedDateRequired') }
        return
      }
      if (statusMessage === 'DELIVERED_DATE_REQUIRED') {
        formMessage.value = { type: 'red', text: t('maintenance.messages.deliveredDateRequired') }
        return
      }
      if (statusMessage === 'CUSTOMER_ID_REQUIRED') {
        formMessage.value = { type: 'red', text: t('maintenance.messages.customerRequired') }
        return
      }
      formMessage.value = {
        type: 'red',
        text: wasEditing ? t('maintenance.messages.updateFailed') : t('maintenance.messages.saveFailed')
      }
      console.error('Failed to save maintenance ticket', error)
    }
  })
}

const formatDateInput = (value?: string | null) => {
  if (!value) {
    return ''
  }
  return new Date(value).toISOString().slice(0, 10)
}

const startEdit = (ticket: MaintenanceTicket) => {
  const customer = store.customers.find((entry) => entry.customer_id === ticket.customer_id)
  const device = store.customerDevices.find((entry) => entry.device_id === ticket.customer_device_id)

  editingTicketId.value = ticket.ticket_id
  editingCustomerId.value = ticket.customer_id
  editingDeviceId.value = ticket.customer_device_id

  customerForm.name = customer?.name ?? ''
  customerForm.name_amharic = customer?.name_amharic ?? ''
  customerForm.phone = customer?.phone ?? ''
  customerForm.email = customer?.email ?? ''
  customerForm.tin = customer?.tin ?? ''
  customerForm.vat_registration_no = customer?.vat_registration_no ?? ''

  deviceForm.item_name = device?.item_name ?? ''
  deviceForm.brand = device?.brand ?? ''
  deviceForm.model = device?.model ?? ''
  deviceForm.serial_number = device?.serial_number ?? ''

  ticketForm.receipt_number = ticket.receipt_number ?? ''
  ticketForm.receipt_attachment = ticket.receipt_attachment ?? ''
  ticketForm.received_at = formatDateInput(ticket.received_at)
  ticketForm.target_delivery_at = formatDateInput(ticket.target_delivery_at)
  ticketForm.delivered_at = formatDateInput(ticket.delivered_at)
  ticketForm.technician_id = ticket.technician_id ?? ''
  ticketForm.employee_name = ticket.employee_name ?? ''
  ticketForm.labor_cost = ticket.labor_cost ?? 0
  ticketForm.problem_description = ticket.problem_description
  ticketForm.priority = ticket.priority
  ticketForm.warranty_status = ticket.warranty_status
  ticketForm.status = ticket.status
  ticketForm.location_id = ticket.location_id
  attachmentErrors.value = []
  ticketAttachments.value = []
}

const cancelEdit = async () => {
  await resetForm()
}

const submitPartRequest = async () => {
  await withPartRequestLock(async () => {
    partRequestMessage.value = null
    if (!canRequestParts.value) {
      partRequestMessage.value = { type: 'red', text: t('permissions.readOnly') }
      return
    }
    if (!editingTicketId.value || !editingDeviceId.value) {
      partRequestMessage.value = { type: 'red', text: t('maintenance.messages.partRequestTicketRequired') }
      return
    }
    if (partRequestMode.value === 'internal' && !partRequestForm.part_id) {
      partRequestMessage.value = { type: 'red', text: t('maintenance.messages.partRequired') }
      return
    }
    if (!partRequestForm.requested_by.trim()) {
      partRequestMessage.value = { type: 'red', text: t('maintenance.messages.requestedByRequired') }
      return
    }
    if (!ticketForm.technician_id.trim()) {
      partRequestMessage.value = { type: 'red', text: t('maintenance.messages.technicianRequired') }
      return
    }
    if (!ticketForm.location_id) {
      partRequestMessage.value = { type: 'red', text: t('maintenance.messages.locationRequired') }
      return
    }
    if (partRequestForm.quantity_requested <= 0) {
      partRequestMessage.value = { type: 'red', text: t('maintenance.messages.partQuantityRequired') }
      return
    }

    if (partRequestMode.value === 'external') {
      if (!partRequestForm.external_item_name.trim()) {
        partRequestMessage.value = { type: 'red', text: t('maintenance.messages.externalItemRequired') }
        return
      }
      if (!partRequestForm.external_receipt_number.trim()) {
        partRequestMessage.value = { type: 'red', text: t('maintenance.messages.externalReceiptRequired') }
        return
      }
      if (partRequestForm.external_cost <= 0) {
        partRequestMessage.value = { type: 'red', text: t('maintenance.messages.externalCostRequired') }
        return
      }
    }

    const isApproved = partRequestForm.status === 'APPROVED' && canApproveParts.value
    const approvedAt = isApproved ? new Date().toISOString() : null
    const approvedBy = isApproved ? user.value?.user_id ?? null : null

    try {
      await store.createPartRequest({
        ticket_id: editingTicketId.value,
        customer_device_id: editingDeviceId.value,
        part_id: partRequestMode.value === 'external' ? null : partRequestForm.part_id,
        quantity_requested: partRequestForm.quantity_requested,
        requested_by: partRequestForm.requested_by,
        technician_id: ticketForm.technician_id,
        status: partRequestForm.status,
        source_preference: partRequestMode.value === 'external' ? 'EXTERNAL_SUPPLIER' : 'STORE_INVENTORY',
        external_item_name:
          partRequestMode.value === 'external' ? partRequestForm.external_item_name.trim() : null,
        external_model:
          partRequestMode.value === 'external' && partRequestForm.external_model.trim()
            ? partRequestForm.external_model.trim()
            : null,
        external_cost: partRequestMode.value === 'external' ? partRequestForm.external_cost : null,
        external_receipt_number:
          partRequestMode.value === 'external' ? partRequestForm.external_receipt_number.trim() : null,
        external_receipt_data_url:
          partRequestMode.value === 'external' && partRequestForm.external_receipt_data_url
            ? partRequestForm.external_receipt_data_url
            : null,
        external_receipt_file_name:
          partRequestMode.value === 'external' && partRequestForm.external_receipt_file_name
            ? partRequestForm.external_receipt_file_name
            : null,
        external_receipt_file_type:
          partRequestMode.value === 'external' && partRequestForm.external_receipt_file_type
            ? partRequestForm.external_receipt_file_type
            : null,
        external_receipt_file_size:
          partRequestMode.value === 'external' && partRequestForm.external_receipt_file_size
            ? partRequestForm.external_receipt_file_size
            : null,
        approved_by: approvedBy,
        approved_at: approvedAt,
        notes: partRequestForm.notes || null,
        location_id: ticketForm.location_id
      })
    } catch (error: any) {
      const statusMessage = error?.data?.statusMessage || error?.message
      if (statusMessage === 'INSUFFICIENT_STOCK') {
        partRequestMessage.value = { type: 'red', text: t('maintenance.messages.partRequestInsufficientStock') }
        return
      }
      throw error
    }

    partRequestNotice.value = { type: 'primary', text: t('maintenance.messages.partRequestSaved') }
    isPartRequestModalOpen.value = false
    resetPartRequestForm()
  })
}

const handleStatusChange = async (request: PartRequest, event: Event) => {
  const target = event.target as HTMLSelectElement
  const nextStatus = target.value as PartRequest['status']
  if (nextStatus === request.status) {
    return
  }
  partRequestNotice.value = null
  const isApproved = nextStatus === 'APPROVED'
  const approvedAt = isApproved ? new Date().toISOString() : request.approved_at ?? null
  const approvedBy = isApproved ? user.value?.user_id ?? null : request.approved_by ?? null

  try {
    await store.updatePartRequest({
      ...request,
      status: nextStatus,
      approved_by: approvedBy,
      approved_at: approvedAt
    })
    partRequestNotice.value = { type: 'primary', text: t('maintenance.messages.partRequestUpdated') }
  } catch (error: any) {
    const statusMessage = error?.data?.statusMessage || error?.message
    if (statusMessage === 'INSUFFICIENT_STOCK') {
      partRequestNotice.value = { type: 'red', text: t('maintenance.messages.partRequestInsufficientStock') }
      return
    }
    if (statusMessage === 'REQUEST_APPROVED_LOCKED') {
      partRequestNotice.value = { type: 'red', text: t('maintenance.messages.partRequestLocked') }
      return
    }
    if (statusMessage === 'FORBIDDEN') {
      partRequestNotice.value = { type: 'red', text: t('permissions.readOnly') }
      return
    }
    throw error
  }
}

const confirmDelete = async (request: PartRequest) => {
  if (!process.client) {
    return
  }
  const confirmed = window.confirm(t('maintenance.messages.partRequestDeleteConfirm'))
  if (!confirmed) {
    return
  }
  partRequestNotice.value = null
  try {
    await store.deletePartRequest(request.request_id)
    partRequestNotice.value = { type: 'primary', text: t('maintenance.messages.partRequestDeleted') }
  } catch (error: any) {
    const statusMessage = error?.data?.statusMessage || error?.message
    if (statusMessage === 'REQUEST_APPROVED_LOCKED') {
      partRequestNotice.value = { type: 'red', text: t('maintenance.messages.partRequestLocked') }
      return
    }
    if (statusMessage === 'FORBIDDEN') {
      partRequestNotice.value = { type: 'red', text: t('permissions.readOnly') }
      return
    }
    throw error
  }
}

onMounted(async () => {
  await loadPermissions()
  await loadTechnicians()
  if (!inventoryStore.isLoaded) {
    await inventoryStore.loadAll()
  }
  if (!settingsStore.isLoaded) {
    await settingsStore.loadAll()
  }
  if (!store.isLoaded) {
    await store.loadAll()
  }
  if (prefillTicketId.value) {
    const ticket = store.tickets.find((entry) => entry.ticket_id === prefillTicketId.value)
    if (ticket) {
      startEdit(ticket)
    }
  }
  syncPartQuery()
})

watch(
  () => partRequestForm.part_id,
  () => {
    syncPartQuery()
  }
)
</script>
