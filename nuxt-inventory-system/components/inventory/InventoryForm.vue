<template>
  <div class="space-y-6">
    <div :class="showList ? 'grid gap-6 lg:grid-cols-[1.1fr,0.9fr]' : 'space-y-6'">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">
          {{ isEdit ? t('inventory.formTitleEdit') : t('inventory.formTitleAdd') }}
        </h2>
        <div
          v-if="notFoundMessage"
          class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ notFoundMessage }}
        </div>
        <form v-else class="mt-4 grid gap-4" @submit.prevent="handleSubmit">
          <div
            v-if="submitError"
            class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
          >
            {{ submitError }}
          </div>
          <div v-if="formErrors.length" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <div class="text-xs font-semibold uppercase text-red-700">
              {{ t('inventory.validation.errorsTitle') }}
            </div>
            <ul class="mt-2 list-disc space-y-1 pl-4">
              <li v-for="message in formErrors" :key="message">{{ message }}</li>
            </ul>
          </div>
          <div
            v-if="formWarnings.length"
            class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"
          >
            <div class="text-xs font-semibold uppercase text-amber-700">
              {{ t('inventory.validation.warningsTitle') }}
            </div>
            <ul class="mt-2 list-disc space-y-1 pl-4">
              <li v-for="message in formWarnings" :key="message">{{ message }}</li>
            </ul>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div class="text-xs font-semibold uppercase text-slate-500">
              {{ t('inventory.fields.receiveStock') }}
            </div>
            <div v-if="latestReceipt" class="mt-1 text-xs text-slate-500">
              {{ t('inventory.fields.lastReceipt') }}:
              {{ formatDate(latestReceipt.received_at) }} •
              {{ t('inventory.fields.quantityReceived') }} {{ latestReceipt.quantity_received }} •
              <template v-if="canViewCost">
                {{ t('inventory.fields.unitCost') }} {{ formatCurrency(latestReceipt.unit_cost) }} •
              </template>
              {{ t('inventory.fields.receivedLocation') }} {{ locationName(latestReceipt.location_id) }}
            </div>
            <div v-else class="mt-1 text-xs text-slate-500">
              {{ t('inventory.fields.noReceiptsYet') }}
            </div>
            <div class="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.fields.receivedDate') }}
                </label>
                <input
                  v-model="receiptForm.received_at"
                  type="date"
                  class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <div class="flex min-h-[20px] items-center justify-between">
                  <label class="text-xs font-semibold uppercase leading-none text-slate-500">
                    {{ t('inventory.fields.receivedLocation') }}
                  </label>
                  <button
                    v-if="canManageLocations"
                    type="button"
                    class="text-xs font-semibold leading-none text-emerald-600 hover:text-emerald-700"
                    @click="toggleLocationForm"
                  >
                    {{ t('inventory.actions.addLocation') }}
                  </button>
                </div>
                <select
                  v-model="receiptForm.location_id"
                  class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                >
                  <option value="">{{ t('inventory.options.selectLocation') }}</option>
                  <option v-for="location in store.locations" :key="location.location_id" :value="location.location_id">
                    {{ location.name }}
                  </option>
                </select>
                <div
                  v-if="isLocationFormOpen && canManageLocations"
                  class="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('inventory.locationForm.title') }}
                  </div>
                <div class="grid gap-3 md:grid-cols-2">
                  <div>
                    <label class="text-xs font-semibold uppercase text-slate-500">
                      {{ t('inventory.locationForm.name') }}
                    </label>
                    <input
                      v-model="locationForm.name"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-semibold uppercase text-slate-500">
                      {{ t('inventory.locationForm.type') }}
                    </label>
                    <select
                      v-model="locationForm.location_type"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="STORE">{{ t('inventory.options.store') }}</option>
                      <option value="WORKSHOP">{{ t('inventory.options.workshop') }}</option>
                      <option value="WAREHOUSE">{{ t('inventory.options.warehouse') }}</option>
                    </select>
                  </div>
                </div>
                <div class="grid gap-3 md:grid-cols-2">
                  <div>
                    <label class="text-xs font-semibold uppercase text-slate-500">
                      {{ t('inventory.locationForm.subCity') }}
                    </label>
                    <input
                      v-model="locationForm.sub_city"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-semibold uppercase text-slate-500">
                      {{ t('inventory.locationForm.houseNo') }}
                    </label>
                    <input
                      v-model="locationForm.house_no"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div class="grid gap-3 md:grid-cols-2">
                  <div>
                    <label class="text-xs font-semibold uppercase text-slate-500">
                      {{ t('inventory.locationForm.city') }}
                    </label>
                    <input
                      v-model="locationForm.city"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-semibold uppercase text-slate-500">
                      {{ t('inventory.locationForm.country') }}
                    </label>
                    <input
                      v-model="locationForm.country"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('inventory.locationForm.poBox') }}
                  </label>
                  <input
                    v-model="locationForm.po_box"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                  <div v-if="locationFormError" class="text-xs text-red-600">
                    {{ locationFormError }}
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <UButton size="xs" color="primary" type="button" @click="saveLocation">
                      {{ t('inventory.locationForm.save') }}
                    </UButton>
                    <UButton size="xs" color="gray" variant="outline" type="button" @click="cancelLocationForm">
                      {{ t('inventory.locationForm.cancel') }}
                    </UButton>
                  </div>
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.fields.quantityReceived') }}
                </label>
                <input
                  v-model.number="receiptForm.quantity_received"
                  type="number"
                  min="0"
                  class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div v-if="canViewCost">
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.fields.unitCost') }}
                </label>
                <input
                  v-model.number="receiptForm.unit_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div v-else>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.fields.unitCost') }}
                </label>
                <div class="mt-1 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400">
                  {{ t('permissions.restricted') }}
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.fields.employeeName') }}
                </label>
                <input
                  v-model="receiptForm.employee_name"
                  class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  :disabled="!isAdmin"
                  required
                />
              </div>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.name') }}</label>
              <input
                v-model="form.name"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                :disabled="isCostSheetLocked"
                required
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.model') }}</label>
              <input
                v-model="form.model"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                :disabled="isCostSheetLocked"
                required
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.fields.serialNumber') }}
              </label>
              <input
                v-model="form.serial_number"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.fields.employeeName') }}
              </label>
              <input
                v-model="form.employee_name"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                :disabled="!isAdmin"
                required
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.sku') }}</label>
              <input
                v-model="form.sku"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.fields.vendorSku') }}
              </label>
              <input
                v-model="form.vendor_sku"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <div class="flex min-h-[20px] items-center justify-between">
                <label class="text-xs font-semibold uppercase leading-none text-slate-500">
                  {{ t('inventory.fields.unit') }}
                </label>
                <button
                  type="button"
                  class="text-xs font-semibold leading-none text-emerald-600 hover:text-emerald-700"
                  @click="toggleUnitForm"
                >
                  {{ t('inventory.actions.addUnit') }}
                </button>
              </div>
              <select
                v-model="form.unit"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                :disabled="isCostSheetLocked"
                required
              >
                <option value="">{{ t('inventory.options.selectUnit') }}</option>
                <option v-for="unit in store.units" :key="unit.unit_id" :value="unit.name">
                  {{ unit.name }}
                </option>
              </select>
              <div v-if="isUnitFormOpen" class="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.unitForm.title') }}
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('inventory.unitForm.name') }}
                  </label>
                  <input
                    v-model="unitForm.name"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div v-if="unitFormError" class="text-xs text-red-600">
                  {{ unitFormError }}
                </div>
                <div class="flex flex-wrap gap-2">
                  <UButton size="xs" color="primary" type="button" @click="saveUnit">
                    {{ t('inventory.unitForm.save') }}
                  </UButton>
                  <UButton size="xs" color="gray" variant="outline" type="button" @click="cancelUnitForm">
                    {{ t('inventory.unitForm.cancel') }}
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.description') }}</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <div class="flex min-h-[20px] items-center justify-between">
                <label class="text-xs font-semibold uppercase leading-none text-slate-500">
                  {{ t('inventory.fields.type') }}
                </label>
              </div>
              <select
                v-model="form.item_type"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              >
                <option value="PRODUCT">{{ t('inventory.options.product') }}</option>
                <option value="SPARE_PART">{{ t('inventory.options.sparePart') }}</option>
              </select>
            </div>
            <div>
              <div class="flex min-h-[20px] items-center justify-between">
                <label class="text-xs font-semibold uppercase leading-none text-slate-500">
                  {{ t('inventory.fields.category') }}
                </label>
                <button
                  type="button"
                  class="text-xs font-semibold leading-none text-emerald-600 hover:text-emerald-700"
                  @click="toggleCategoryForm"
                >
                  {{ t('inventory.actions.addCategory') }}
                </button>
              </div>
              <select
                v-model="form.category_id"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              >
                <option value="">{{ t('inventory.options.uncategorized') }}</option>
                <option v-for="category in store.categories" :key="category.category_id" :value="category.category_id">
                  {{ category.name }}
                </option>
              </select>
              <div v-if="isCategoryFormOpen" class="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.categoryForm.title') }}
                </div>
                <div class="grid gap-3 md:grid-cols-2">
                  <div>
                    <label class="text-xs font-semibold uppercase text-slate-500">
                      {{ t('inventory.categoryForm.name') }}
                    </label>
                    <input
                      v-model="categoryForm.name"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-semibold uppercase text-slate-500">
                      {{ t('inventory.categoryForm.type') }}
                    </label>
                    <select
                      v-model="categoryForm.category_type"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="PRODUCT">{{ t('inventory.options.product') }}</option>
                      <option value="SPARE_PART">{{ t('inventory.options.sparePart') }}</option>
                      <option value="BOTH">{{ t('inventory.options.both') }}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-slate-500">
                    {{ t('inventory.categoryForm.description') }}
                  </label>
                  <input
                    v-model="categoryForm.description"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div v-if="categoryFormError" class="text-xs text-red-600">
                  {{ categoryFormError }}
                </div>
                <div class="flex flex-wrap gap-2">
                  <UButton size="xs" color="primary" type="button" @click="saveCategory">
                    {{ t('inventory.categoryForm.save') }}
                  </UButton>
                  <UButton size="xs" color="gray" variant="outline" type="button" @click="cancelCategoryForm">
                    {{ t('inventory.categoryForm.cancel') }}
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.fields.pricingMode') }}
              </label>
              <select
                v-model="form.pricing_mode"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="MANUAL">{{ t('inventory.options.manualPrice') }}</option>
                <option value="MARGIN_PERCENT">{{ t('inventory.options.marginPrice') }}</option>
                <option value="PRICE_LIST">{{ t('inventory.options.priceList') }}</option>
                <option value="COST_SHEET">{{ t('inventory.options.costSheetPrice') }}</option>
              </select>
            </div>
            <div v-if="canViewPrice">
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.fields.price') }}
              </label>
              <input
                v-if="form.pricing_mode === 'MANUAL' || form.pricing_mode === 'PRICE_LIST'"
                v-model.number="form.price"
                type="number"
                step="0.01"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                :disabled="!canEditPrice"
                required
              />
              <div
                v-else
                class="mt-1 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
              >
                {{ formatCurrency(derivedPrice) }}
              </div>
            </div>
            <div v-else class="flex flex-col justify-end">
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.fields.price') }}
              </label>
              <div class="mt-1 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400">
                {{ t('permissions.restricted') }}
              </div>
            </div>
            <div v-if="canViewCost">
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.fields.lastCost') }}
              </label>
              <div
                class="mt-1 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
              >
                {{ formatCurrency(form.cost) }}
              </div>
            </div>
            <div v-else class="flex flex-col justify-end">
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.fields.lastCost') }}
              </label>
              <div class="mt-1 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400">
                {{ t('permissions.restricted') }}
              </div>
            </div>
          </div>

          <div
            v-if="form.pricing_mode === 'COST_SHEET'"
            class="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div class="text-xs font-semibold uppercase text-slate-500">
              {{ t('inventory.costSheet.title') }}
            </div>
            <div class="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div class="w-full md:flex-1">
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.costSheet.entry') }}
                </label>
                <select
                  v-model="form.cost_sheet_entry_id"
                  class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">{{ t('inventory.costSheet.manualEntry') }}</option>
                  <option
                    v-for="entry in availableCostSheets"
                    :key="entry.cost_sheet_id"
                    :value="entry.cost_sheet_id"
                  >
                    {{ formatCostSheetEntry(entry) }}
                  </option>
                </select>
                <p v-if="availableCostSheets.length === 0" class="mt-1 text-xs text-slate-500">
                  {{ t('inventory.costSheet.noEntries') }}
                </p>
              </div>
              <NuxtLink
                :to="localePath('/inventory/cost-sheet')"
                class="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                {{ t('inventory.costSheet.manage') }}
              </NuxtLink>
            </div>
            <div class="mt-3 grid gap-4 md:grid-cols-3">
              <div>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.costSheet.quantity') }}
                </label>
                <input
                  v-model.number="form.cost_sheet_quantity"
                  type="number"
                  min="0"
                  class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  :disabled="isCostSheetLocked"
                />
              </div>
              <div v-if="canViewCost">
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.costSheet.unitCost') }}
                </label>
                <input
                  v-model.number="form.cost_sheet_unit_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  :disabled="isCostSheetLocked"
                />
              </div>
              <div v-else>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.costSheet.unitCost') }}
                </label>
                <div class="mt-1 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400">
                  {{ t('permissions.restricted') }}
                </div>
              </div>
              <div v-if="canViewCost">
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.costSheet.totalWithVat') }}
                </label>
                <div class="mt-1 flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                  {{ formatCurrency(costSheetTotalWithVat) }}
                </div>
              </div>
              <div v-else>
                <label class="text-xs font-semibold uppercase text-slate-500">
                  {{ t('inventory.costSheet.totalWithVat') }}
                </label>
                <div class="mt-1 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400">
                  {{ t('permissions.restricted') }}
                </div>
              </div>
            </div>
            <p class="mt-2 text-xs text-slate-500">
              {{ t('inventory.costSheet.vatRate', { rate: costSheetVatRatePercent }) }}
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div v-if="form.pricing_mode === 'MARGIN_PERCENT'">
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.fields.marginPercent') }}
              </label>
              <input
                v-model.number="form.margin_percent"
                type="number"
                min="0"
                step="0.01"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div class="md:col-span-2">
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.fields.priceOverrideReason') }}
              </label>
              <input
                v-model="form.price_override_reason"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <p class="mt-1 text-xs text-slate-500">
                {{ t('inventory.fields.priceUpdatedAt') }}: {{ priceUpdatedLabel }}
              </p>
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">
                {{ t('inventory.fields.stockLocation') }}
              </label>
              <select
                v-model="form.stock_location"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="STORE">{{ t('inventory.options.store') }}</option>
                <option value="WORKSHOP">{{ t('inventory.options.workshop') }}</option>
                <option value="BOTH">{{ t('inventory.options.both') }}</option>
              </select>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{
                t('inventory.fields.manufacturer')
              }}</label>
              <input
                v-model="form.manufacturer"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.barcode') }}</label>
              <input
                v-model="form.barcode"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.weight') }}</label>
              <input
                v-model.number="form.weight"
                type="number"
                step="0.01"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.dimensions') }}</label>
              <input
                v-model="form.dimensions"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{
                t('inventory.fields.warrantyPeriod')
              }}</label>
              <input
                v-model.number="form.warranty_period"
                type="number"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.minStock') }}</label>
              <input
                v-model.number="form.min_stock_level"
                type="number"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.reorderQty') }}</label>
              <input
                v-model.number="form.reorder_quantity"
                type="number"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div class="flex items-end gap-2">
              <input id="maintenance-flag" v-model="form.is_for_maintenance" type="checkbox" />
              <label class="text-xs font-semibold uppercase text-slate-500" for="maintenance-flag">
                {{ t('inventory.fields.forMaintenance') }}
              </label>
            </div>
          </div>

          <div class="space-y-3 rounded-xl border border-dashed border-slate-200 bg-white p-4">
            <div>
              <div class="text-xs font-semibold uppercase text-slate-500">{{ t('inventory.fields.attachments') }}</div>
              <p class="mt-1 text-xs text-slate-500">{{ t('inventory.attachments.helper') }}</p>
            </div>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              class="text-xs text-slate-600"
              @change="handleAttachmentSelect"
            />
            <div v-if="attachmentErrors.length" class="space-y-1 text-xs text-red-600">
              <div v-for="message in attachmentErrors" :key="message">{{ message }}</div>
            </div>
            <div v-if="existingAttachments.length" class="space-y-2">
              <div class="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                <span>{{ t('inventory.attachments.savedTitle') }}</span>
                <span v-if="existingAttachments.length > 1" class="font-normal text-slate-400">
                  {{ t('inventory.attachments.reorderHint') }}
                </span>
              </div>
              <div
                v-for="attachment in existingAttachments"
                :key="attachment.attachment_id"
                class="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs transition"
                :class="
                  dragOverAttachmentId === attachment.attachment_id
                    ? 'border-emerald-300 bg-emerald-50'
                    : ''
                "
                draggable="true"
                @dragstart="handleAttachmentDragStart(attachment.attachment_id)"
                @dragend="handleAttachmentDragEnd"
                @dragover.prevent="handleAttachmentDragOver(attachment.attachment_id)"
                @drop="handleAttachmentDrop(attachment.attachment_id)"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <div
                    class="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-[10px] font-semibold uppercase text-slate-500"
                    role="button"
                    tabindex="0"
                    @click="openAttachmentPreview(attachment)"
                    @keydown.enter.prevent="openAttachmentPreview(attachment)"
                  >
                    <img
                      v-if="isImageAttachment(attachment.file_type)"
                      :src="attachment.data_url"
                      :alt="attachment.file_name"
                      class="h-full w-full object-cover"
                    />
                    <span v-else>PDF</span>
                  </div>
                  <div class="min-w-0">
                    <a
                      class="block truncate text-slate-700 hover:text-slate-900"
                      :href="attachment.data_url"
                      target="_blank"
                      rel="noopener"
                    >
                      {{ attachment.file_name }}
                    </a>
                    <div class="text-[11px] text-slate-500">{{ formatFileSize(attachment.file_size) }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2 text-slate-500">
                  <span class="cursor-move text-[10px] uppercase">{{ t('inventory.attachments.drag') }}</span>
                  <button
                    type="button"
                    class="text-slate-600 hover:text-slate-800"
                    @click="openAttachmentPreview(attachment)"
                  >
                    {{ t('inventory.attachments.preview') }}
                  </button>
                  <button
                    type="button"
                    class="text-red-600 hover:text-red-700"
                    @click="removeAttachment(attachment.attachment_id)"
                  >
                    {{ t('inventory.actions.delete') }}
                  </button>
                </div>
              </div>
            </div>
            <div v-if="pendingAttachments.length" class="space-y-2">
              <div class="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                <span>{{ t('inventory.attachments.pendingTitle') }}</span>
                <span v-if="pendingAttachments.length > 1" class="font-normal text-slate-400">
                  {{ t('inventory.attachments.reorderHint') }}
                </span>
              </div>
              <div
                v-for="attachment in pendingAttachments"
                :key="attachment.temp_id"
                class="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs transition"
                :class="dragOverPendingId === attachment.temp_id ? 'border-emerald-300 bg-emerald-100' : ''"
                draggable="true"
                @dragstart="handlePendingDragStart(attachment.temp_id)"
                @dragend="handlePendingDragEnd"
                @dragover.prevent="handlePendingDragOver(attachment.temp_id)"
                @drop="handlePendingDrop(attachment.temp_id)"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <div
                    class="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-lg border border-emerald-200 bg-white text-[10px] font-semibold uppercase text-emerald-600"
                    role="button"
                    tabindex="0"
                    @click="openPendingPreview(attachment)"
                    @keydown.enter.prevent="openPendingPreview(attachment)"
                  >
                    <img
                      v-if="isImageAttachment(attachment.file_type)"
                      :src="attachment.data_url"
                      :alt="attachment.file_name"
                      class="h-full w-full object-cover"
                    />
                    <span v-else>PDF</span>
                  </div>
                  <div class="min-w-0">
                    <span class="block truncate text-slate-700">{{ attachment.file_name }}</span>
                    <div class="text-[11px] text-slate-500">{{ formatFileSize(attachment.file_size) }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2 text-slate-500">
                  <span class="cursor-move text-[10px] uppercase">{{ t('inventory.attachments.drag') }}</span>
                  <button
                    type="button"
                    class="text-slate-600 hover:text-slate-800"
                    @click="openPendingPreview(attachment)"
                  >
                    {{ t('inventory.attachments.preview') }}
                  </button>
                  <button
                    type="button"
                    class="text-slate-600 hover:text-slate-800"
                    @click="removePendingAttachment(attachment.temp_id)"
                  >
                    {{ t('inventory.actions.clear') }}
                  </button>
                </div>
              </div>
            </div>
            <div
              v-if="!existingAttachments.length && !pendingAttachments.length"
              class="text-xs text-slate-500"
            >
              {{ t('inventory.attachments.empty') }}
            </div>
          </div>

          <div v-if="!canEditInventory" class="text-xs text-slate-500">
            {{ t('permissions.readOnly') }}
          </div>

          <div class="flex flex-wrap gap-3 pt-2">
            <UButton type="submit" color="primary" :disabled="formErrors.length > 0 || !canEditInventory">
              {{ editingItem ? t('inventory.actions.save') : t('inventory.actions.add') }}
            </UButton>
            <UButton type="button" color="gray" variant="outline" @click="resetForm">
              {{ t('inventory.actions.clear') }}
            </UButton>
          </div>
        </form>
      </div>

      <div v-if="showList" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">{{ t('inventory.listTitle') }}</h2>
        <div v-if="store.items.length === 0" class="mt-4 text-sm text-slate-500">
          {{ t('inventory.empty') }}
        </div>
        <div v-else class="mt-4 space-y-3">
          <div
            v-for="item in store.items"
            :key="item.item_id"
            class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-slate-900">
                  {{ item.name }}
                </div>
                <div class="text-xs text-slate-500">{{ item.item_type }} · {{ categoryName(item.category_id) }}</div>
                <div class="mt-2 text-xs text-slate-500">
                  {{ t('inventory.totalStock') }}: {{ totalQuantity(item.item_id) }}
                </div>
              </div>
              <div class="flex gap-2">
                <UButton size="xs" color="gray" variant="outline" @click="startEdit(item)">{{
                  t('inventory.actions.edit')
                }}</UButton>
                <UButton
                  v-if="canDeleteItem(item)"
                  size="xs"
                  color="red"
                  variant="outline"
                  @click="removeItem(item.item_id)"
                >
                  {{ t('inventory.actions.delete') }}
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UModal v-model:open="isAttachmentPreviewOpen" portal="body">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0">
                <div class="truncate text-sm font-semibold text-slate-900">{{ previewAttachment?.file_name }}</div>
                <div class="text-xs text-slate-500">
                  {{ previewAttachment ? formatFileSize(previewAttachment.file_size) : '' }}
                </div>
              </div>
              <a
                v-if="previewAttachment"
                class="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                :href="previewAttachment.data_url"
                target="_blank"
                rel="noopener"
              >
                {{ t('inventory.attachments.download') }}
              </a>
            </div>
          </template>
          <div class="flex max-h-[70vh] items-center justify-center overflow-hidden bg-slate-50">
            <img
              v-if="previewAttachment && isImageAttachment(previewAttachment.file_type)"
              :src="previewAttachment.data_url"
              :alt="previewAttachment.file_name"
              class="max-h-[70vh] w-full object-contain"
            />
            <iframe
              v-else-if="previewAttachment"
              :src="previewAttachment.data_url"
              class="h-[70vh] w-full"
            />
          </div>
          <template #footer>
            <div class="flex justify-end">
              <UButton color="gray" variant="outline" @click="closeAttachmentPreview">
                {{ t('inventory.attachments.close') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useInventoryStore, type CategoryInput, type ItemInput } from '~/stores/inventory'
import { useSettingsStore } from '~/stores/settings'
import { usePermissions } from '~/composables/usePermissions'
import { useFlashMessage } from '~/composables/useFlashMessage'
import { useAuth } from '~/composables/useAuth'
import type { CostSheetEntry, Item, ItemAttachment } from '~/types/database'
import { createId } from '~/utils/id'

const props = withDefaults(
  defineProps<{ itemId?: string | null; redirectTo?: string | null; showList?: boolean }>(),
  {
    itemId: null,
    redirectTo: null,
    showList: false
  }
)
const emit = defineEmits<{ saved: [string] }>()

const store = useInventoryStore()
const settingsStore = useSettingsStore()
const { can, loadPermissions } = usePermissions()
const { setFlashMessage } = useFlashMessage()
const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { user } = useAuth()

const showList = computed(() => props.showList)
const isEdit = computed(() => Boolean(props.itemId))
const notFoundMessage = ref('')
const submitError = ref('')
const prefillCostSheetId = computed(() =>
  typeof route.query.costSheet === 'string' ? route.query.costSheet : ''
)

const canViewPrice = computed(() => can('inventory.field.price.view'))
const canEditPrice = computed(() => can('inventory.field.price.edit'))
const canViewCost = computed(() => can('inventory.field.cost.view'))
const canEditInventory = computed(() => can('inventory.edit'))
const canManageLocations = computed(() => can('inventory.locations.manage'))
const canRemoveCostSheetItems = computed(() => can('inventory.cost_sheet.remove'))
const isAdmin = computed(() => user.value?.role === 'admin')
const defaultEmployeeName = computed(() => user.value?.name || user.value?.username || user.value?.email || '')

const defaultMarginPercent = ref(40)
const vatRate = computed(() => {
  const rate = Number(settingsStore.getSetting('tax_rate')?.setting_value ?? 0)
  return Number.isFinite(rate) ? rate : 0
})
const costSheetVatRate = computed(() => {
  const stored = form.value.cost_sheet_vat_rate
  if (stored === null || stored === undefined) {
    return vatRate.value
  }
  const parsed = Number(stored)
  return Number.isFinite(parsed) ? parsed : vatRate.value
})

const costSheetVatRatePercent = computed(() => {
  const percent = costSheetVatRate.value * 100
  if (!Number.isFinite(percent)) {
    return '0'
  }
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(2)
})

const defaultForm = (): ItemInput => ({
  name: '',
  model: '',
  serial_number: '',
  description: '',
  price: 0,
  cost: 0,
  category_id: null,
  location_id: null,
  item_type: 'PRODUCT',
  is_for_maintenance: false,
  min_stock_level: 5,
  reorder_quantity: 10,
  stock_location: 'BOTH',
  sku: '',
  vendor_sku: '',
  barcode: '',
  weight: null,
  dimensions: '',
  manufacturer: '',
  warranty_period: null,
  unit: '',
  employee_name: defaultEmployeeName.value,
  pricing_mode: 'COST_SHEET',
  margin_percent: defaultMarginPercent.value,
  price_override_reason: '',
  cost_sheet_quantity: 1,
  cost_sheet_unit_cost: 0,
  cost_sheet_total_with_vat: 0,
  cost_sheet_vat_rate: null,
  cost_sheet_entry_id: null,
  inventory_location_id: null,
  initial_quantity: 0
})

const form = ref<ItemInput>(defaultForm())
const editingItem = ref<Item | null>(null)
const isCategoryFormOpen = ref(false)
const categoryFormError = ref('')
const categoryForm = ref<CategoryInput>({
  name: '',
  description: '',
  category_type: 'PRODUCT'
})
const isLocationFormOpen = ref(false)
const locationFormError = ref('')
const locationForm = ref({
  name: '',
  location_type: 'STORE',
  sub_city: '',
  house_no: '',
  city: '',
  country: '',
  po_box: ''
})
const isUnitFormOpen = ref(false)
const unitFormError = ref('')
const unitForm = ref({
  name: ''
})

const receiptForm = ref({
  received_at: new Date().toISOString().slice(0, 10),
  location_id: '',
  quantity_received: 0,
  unit_cost: 0,
  employee_name: defaultEmployeeName.value
})

const receiptSnapshot = ref<typeof receiptForm.value | null>(null)

watch(
  defaultEmployeeName,
  (value) => {
    if (!form.value.employee_name) {
      form.value.employee_name = value
    }
    if (!receiptForm.value.employee_name) {
      receiptForm.value.employee_name = value
    }
  },
  { immediate: true }
)

const setReceiptSnapshot = () => {
  receiptSnapshot.value = { ...receiptForm.value }
}

const receiptChanged = computed(() => {
  if (!receiptSnapshot.value) {
    return true
  }
  return (
    receiptSnapshot.value.received_at !== receiptForm.value.received_at ||
    receiptSnapshot.value.location_id !== receiptForm.value.location_id ||
    receiptSnapshot.value.quantity_received !== receiptForm.value.quantity_received ||
    receiptSnapshot.value.unit_cost !== receiptForm.value.unit_cost ||
    receiptSnapshot.value.employee_name !== receiptForm.value.employee_name
  )
})

type PendingAttachment = {
  temp_id: string
  file_name: string
  file_type: string
  file_size: number
  data_url: string
}

type AttachmentPreview = {
  file_name: string
  file_type: string
  file_size: number
  data_url: string
}

const pendingAttachments = ref<PendingAttachment[]>([])
const attachmentErrors = ref<string[]>([])
const maxAttachmentSize = 5 * 1024 * 1024
const allowedAttachmentTypes = ['image/', 'application/pdf']
const draggingAttachmentId = ref<string | null>(null)
const dragOverAttachmentId = ref<string | null>(null)
const draggingPendingId = ref<string | null>(null)
const dragOverPendingId = ref<string | null>(null)
const isAttachmentPreviewOpen = ref(false)
const previewAttachment = ref<AttachmentPreview | null>(null)

const categoryName = (categoryId?: string | null) => {
  if (!categoryId) {
    return t('inventory.options.uncategorized')
  }
  return (
    store.categories.find((category) => category.category_id === categoryId)?.name ??
    t('inventory.options.uncategorized')
  )
}

const availableCostSheets = computed(() => {
  const currentId = form.value.cost_sheet_entry_id ?? ''
  return store.costSheets.filter(
    (entry) => !entry.added_to_inventory || entry.cost_sheet_id === currentId
  )
})

const isCostSheetLocked = computed(() => Boolean(form.value.cost_sheet_entry_id))

const existingAttachments = computed<ItemAttachment[]>(() => {
  if (!editingItem.value) {
    return []
  }
  const entries = store.attachments.filter((entry) => entry.item_id === editingItem.value?.item_id)
  return [...entries].sort((a, b) => {
    const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0)
    if (orderDiff !== 0) {
      return orderDiff
    }
    return (a.created_at ?? '').localeCompare(b.created_at ?? '')
  })
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'ETB' }).format(value || 0)
}

const formatCostSheetEntry = (entry: CostSheetEntry) => {
  const modelLabel = entry.model ? ` (${entry.model})` : ''
  const unitLabel = entry.unit ? ` • ${entry.unit}` : ''
  const base = `${entry.item_name}${modelLabel}${unitLabel} • ${entry.quantity}`
  if (!canViewCost.value) {
    return base
  }
  return `${base} x ${formatCurrency(entry.unit_cost)}`
}

const applyCostSheetEntry = (entry: CostSheetEntry) => {
  form.value.pricing_mode = 'COST_SHEET'
  form.value.name = entry.item_name
  form.value.model = entry.model ?? ''
  form.value.unit = entry.unit ?? ''
  form.value.cost_sheet_quantity = entry.quantity
  form.value.cost_sheet_unit_cost = entry.unit_cost
  form.value.cost_sheet_total_with_vat = entry.total_with_vat
  form.value.cost_sheet_vat_rate = entry.vat_rate
  form.value.cost = entry.unit_cost
  form.value.price = entry.unit_cost * (1 + entry.vat_rate)
  if (!editingItem.value) {
    const defaultLocation =
      receiptForm.value.location_id || (store.locations.length === 1 ? store.locations[0]?.location_id : '')
    receiptForm.value = {
      ...receiptForm.value,
      received_at: receiptForm.value.received_at || new Date().toISOString().slice(0, 10),
      location_id: defaultLocation,
      quantity_received: entry.quantity,
      unit_cost: entry.unit_cost
    }
  }
}

const formatDate = (value: string) => {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleDateString(locale.value)
}

const locationName = (locationId?: string | null) => {
  if (!locationId) {
    return '-'
  }
  return store.locations.find((location) => location.location_id === locationId)?.name ?? locationId
}

const latestReceipt = computed(() => {
  if (!editingItem.value) {
    return null
  }
  const receipts = store.batches
    .filter((batch) => batch.item_id === editingItem.value?.item_id)
    .sort((a, b) => b.received_at.localeCompare(a.received_at))
  return receipts[0] ?? null
})

const derivedPrice = computed(() => {
  const mode = form.value.pricing_mode ?? 'MANUAL'
  if (mode === 'COST_SHEET') {
    return costSheetUnitPrice.value
  }
  if (mode !== 'MARGIN_PERCENT') {
    return form.value.price
  }
  const baseCost =
    receiptForm.value.quantity_received > 0 ? receiptForm.value.unit_cost : form.value.cost
  const margin = form.value.margin_percent ?? 0
  return baseCost * (1 + margin / 100)
})

const costSheetUnitCost = computed(() => Number(form.value.cost_sheet_unit_cost ?? 0))
const costSheetQuantity = computed(() => Number(form.value.cost_sheet_quantity ?? 0))
const costSheetUnitPrice = computed(() => costSheetUnitCost.value * (1 + costSheetVatRate.value))
const costSheetTotalWithVat = computed(() => costSheetUnitPrice.value)

const priceUpdatedLabel = computed(() => {
  const value = editingItem.value?.price_updated_at
  if (!value) {
    return t('inventory.fields.priceUpdatedAtEmpty')
  }
  return new Date(value).toLocaleDateString(locale.value)
})

const formErrors = computed(() => {
  const errors: string[] = []
  if (!form.value.name.trim()) {
    errors.push(t('inventory.validation.nameRequired'))
  }
  if (!form.value.model?.trim()) {
    errors.push(t('inventory.validation.modelRequired'))
  }
  if (!form.value.unit?.trim()) {
    errors.push(t('inventory.validation.unitRequired'))
  }
  if (!form.value.employee_name?.trim()) {
    errors.push(t('inventory.validation.employeeRequired'))
  }
  if (!form.value.item_type) {
    errors.push(t('inventory.validation.typeRequired'))
  }
  if (!form.value.category_id) {
    errors.push(t('inventory.validation.categoryRequired'))
  }
  if (!receiptForm.value.location_id) {
    errors.push(t('inventory.validation.locationRequired'))
  }
  if (form.value.price <= 0) {
    errors.push(t('inventory.validation.priceRequired'))
  }
  if (form.value.price < 0) {
    errors.push(t('inventory.validation.priceNonNegative'))
  }
  if (form.value.cost < 0) {
    errors.push(t('inventory.validation.costNonNegative'))
  }
  if ((form.value.initial_quantity ?? 0) < 0) {
    errors.push(t('inventory.validation.quantityNonNegative'))
  }
  if (form.value.min_stock_level < 0) {
    errors.push(t('inventory.validation.minStockNonNegative'))
  }
  if (form.value.reorder_quantity < 0) {
    errors.push(t('inventory.validation.reorderNonNegative'))
  }
  if (receiptForm.value.quantity_received > 0 && !receiptForm.value.received_at) {
    errors.push(t('inventory.validation.receiptDateRequired'))
  }
  if (receiptForm.value.quantity_received > 0 && !receiptForm.value.employee_name?.trim()) {
    errors.push(t('inventory.validation.receiptEmployeeRequired'))
  }
  if (receiptForm.value.unit_cost < 0) {
    errors.push(t('inventory.validation.unitCostNonNegative'))
  }
  if ((form.value.margin_percent ?? 0) < 0) {
    errors.push(t('inventory.validation.marginNonNegative'))
  }
  if (form.value.pricing_mode === 'COST_SHEET' && !form.value.cost_sheet_entry_id) {
    if ((form.value.cost_sheet_quantity ?? 0) <= 0) {
      errors.push(t('inventory.validation.costSheetQuantityRequired'))
    }
    if ((form.value.cost_sheet_unit_cost ?? 0) < 0) {
      errors.push(t('inventory.validation.costSheetUnitCostNonNegative'))
    }
  }
  return errors
})

const formWarnings = computed(() => {
  const warnings: string[] = []
  if (form.value.cost > form.value.price) {
    warnings.push(t('inventory.validation.costHigherThanPrice'))
  }
  if (form.value.reorder_quantity < form.value.min_stock_level) {
    warnings.push(t('inventory.validation.reorderBelowMin'))
  }
  return warnings
})

const isImageAttachment = (fileType: string) => fileType.startsWith('image/')

const totalQuantity = (itemId: string) => {
  return store.getOnHand(itemId)
}

const canDeleteItem = (item: Item) => {
  if (!canEditInventory.value) {
    return false
  }
  if (item.cost_sheet_entry_id && !canRemoveCostSheetItems.value) {
    return false
  }
  return true
}

const resetForm = () => {
  form.value = defaultForm()
  editingItem.value = null
  submitError.value = ''
  pendingAttachments.value = []
  attachmentErrors.value = []
  draggingAttachmentId.value = null
  dragOverAttachmentId.value = null
  draggingPendingId.value = null
  dragOverPendingId.value = null
  isAttachmentPreviewOpen.value = false
  previewAttachment.value = null
  isCategoryFormOpen.value = false
  categoryFormError.value = ''
  categoryForm.value = { name: '', description: '', category_type: 'PRODUCT' }
  isLocationFormOpen.value = false
  locationFormError.value = ''
  locationForm.value = {
    name: '',
    location_type: 'STORE',
    sub_city: '',
    house_no: '',
    city: '',
    country: '',
    po_box: ''
  }
  isUnitFormOpen.value = false
  unitFormError.value = ''
  unitForm.value = { name: '' }
  receiptForm.value = {
    received_at: new Date().toISOString().slice(0, 10),
    location_id: '',
    quantity_received: 0,
    unit_cost: 0,
    employee_name: defaultEmployeeName.value
  }
  setReceiptSnapshot()
}

const startEdit = (item: Item) => {
  editingItem.value = item
  pendingAttachments.value = []
  attachmentErrors.value = []
  draggingAttachmentId.value = null
  dragOverAttachmentId.value = null
  draggingPendingId.value = null
  dragOverPendingId.value = null
  isAttachmentPreviewOpen.value = false
  previewAttachment.value = null
  isCategoryFormOpen.value = false
  categoryFormError.value = ''
  isLocationFormOpen.value = false
  locationFormError.value = ''
  locationForm.value = {
    name: '',
    location_type: 'STORE',
    sub_city: '',
    house_no: '',
    city: '',
    country: '',
    po_box: ''
  }
  isUnitFormOpen.value = false
  unitFormError.value = ''
  unitForm.value = { name: '' }
  const inventoryRow = store.inventory.find((entry) => entry.item_id === item.item_id)
  const lastReceipt = store.batches
    .filter((batch) => batch.item_id === item.item_id)
    .sort((a, b) => b.received_at.localeCompare(a.received_at))[0]
  receiptForm.value = {
    received_at: lastReceipt?.received_at ?? new Date().toISOString().slice(0, 10),
    location_id: lastReceipt?.location_id ?? inventoryRow?.location_id ?? '',
    quantity_received: lastReceipt?.quantity_received ?? 0,
    unit_cost: lastReceipt?.unit_cost ?? item.cost ?? 0,
    employee_name: lastReceipt?.employee_name ?? defaultEmployeeName.value
  }
  setReceiptSnapshot()

  form.value = {
    ...defaultForm(),
    item_id: item.item_id,
    name: item.name,
    model: item.model ?? '',
    serial_number: item.serial_number ?? '',
    description: item.description ?? '',
    price: item.price,
    cost: item.cost,
    category_id: item.category_id ?? null,
    location_id: item.location_id ?? null,
    item_type: item.item_type,
    is_for_maintenance: item.is_for_maintenance,
    min_stock_level: item.min_stock_level,
    reorder_quantity: item.reorder_quantity,
    stock_location: item.stock_location,
    sku: item.sku ?? '',
    vendor_sku: item.vendor_sku ?? '',
    barcode: item.barcode ?? '',
    weight: item.weight ?? null,
    dimensions: item.dimensions ?? '',
    manufacturer: item.manufacturer ?? '',
    warranty_period: item.warranty_period ?? null,
    unit: item.unit ?? '',
    employee_name: item.employee_name ?? '',
    pricing_mode: item.pricing_mode ?? 'MANUAL',
    margin_percent: item.margin_percent ?? 0,
    price_override_reason: item.price_override_reason ?? '',
    cost_sheet_quantity: item.cost_sheet_quantity ?? 1,
    cost_sheet_unit_cost: item.cost_sheet_unit_cost ?? item.cost ?? 0,
    cost_sheet_total_with_vat: item.cost_sheet_total_with_vat ?? 0,
    cost_sheet_vat_rate: item.cost_sheet_vat_rate ?? null,
    cost_sheet_entry_id: item.cost_sheet_entry_id ?? null,
    inventory_location_id: inventoryRow?.location_id ?? null,
    initial_quantity: inventoryRow?.quantity ?? 0
  }
}

const syncFromProps = () => {
  if (!props.itemId) {
    notFoundMessage.value = ''
    resetForm()
    return
  }
  const item = store.items.find((entry) => entry.item_id === props.itemId)
  if (!item) {
    notFoundMessage.value = t('inventory.messages.itemNotFound')
    editingItem.value = null
    return
  }
  notFoundMessage.value = ''
  startEdit(item)
}

const toggleCategoryForm = () => {
  isCategoryFormOpen.value = !isCategoryFormOpen.value
  categoryFormError.value = ''
}

const cancelCategoryForm = () => {
  isCategoryFormOpen.value = false
  categoryFormError.value = ''
  categoryForm.value = { name: '', description: '', category_type: 'PRODUCT' }
}

const saveCategory = async () => {
  if (!categoryForm.value.name.trim()) {
    categoryFormError.value = t('inventory.validation.categoryNameRequired')
    return
  }

  const created = await store.createCategory({
    name: categoryForm.value.name.trim(),
    description: categoryForm.value.description?.trim() || null,
    category_type: categoryForm.value.category_type
  })
  form.value.category_id = created.category_id
  cancelCategoryForm()
}

const toggleLocationForm = () => {
  if (!canManageLocations.value) {
    return
  }
  isLocationFormOpen.value = !isLocationFormOpen.value
  locationFormError.value = ''
}

const cancelLocationForm = () => {
  isLocationFormOpen.value = false
  locationFormError.value = ''
  locationForm.value = {
    name: '',
    location_type: 'STORE',
    sub_city: '',
    house_no: '',
    city: '',
    country: '',
    po_box: ''
  }
}

const saveLocation = async () => {
  if (!canManageLocations.value) {
    locationFormError.value = t('permissions.restricted')
    return
  }
  const trimmed = locationForm.value.name.trim()
  if (!trimmed) {
    locationFormError.value = t('inventory.validation.locationNameRequired')
    return
  }
  const existing = store.locations.find(
    (entry) => entry.name.toLowerCase() === trimmed.toLowerCase()
  )
  if (existing) {
    receiptForm.value.location_id = existing.location_id
    cancelLocationForm()
    return
  }
  const created = await store.createLocation({
    name: trimmed,
    location_type: locationForm.value.location_type,
    sub_city: locationForm.value.sub_city?.trim() || null,
    house_no: locationForm.value.house_no?.trim() || null,
    city: locationForm.value.city?.trim() || null,
    country: locationForm.value.country?.trim() || null,
    po_box: locationForm.value.po_box?.trim() || null
  })
  receiptForm.value.location_id = created.location_id
  cancelLocationForm()
}

const toggleUnitForm = () => {
  isUnitFormOpen.value = !isUnitFormOpen.value
  unitFormError.value = ''
}

const cancelUnitForm = () => {
  isUnitFormOpen.value = false
  unitFormError.value = ''
  unitForm.value = { name: '' }
}

const saveUnit = async () => {
  const trimmed = unitForm.value.name.trim()
  if (!trimmed) {
    unitFormError.value = t('inventory.validation.unitNameRequired')
    return
  }
  const existing = store.units.find((entry) => entry.name.toLowerCase() === trimmed.toLowerCase())
  if (existing) {
    form.value.unit = existing.name
    cancelUnitForm()
    return
  }
  const created = await store.createUnit(trimmed)
  form.value.unit = created.name
  cancelUnitForm()
}

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const openAttachmentPreview = (attachment: ItemAttachment) => {
  previewAttachment.value = {
    file_name: attachment.file_name,
    file_type: attachment.file_type,
    file_size: attachment.file_size,
    data_url: attachment.data_url
  }
  isAttachmentPreviewOpen.value = true
}

const openPendingPreview = (attachment: PendingAttachment) => {
  previewAttachment.value = {
    file_name: attachment.file_name,
    file_type: attachment.file_type,
    file_size: attachment.file_size,
    data_url: attachment.data_url
  }
  isAttachmentPreviewOpen.value = true
}

const closeAttachmentPreview = () => {
  isAttachmentPreviewOpen.value = false
  previewAttachment.value = null
}

const moveInArray = <T,>(items: T[], from: number, to: number) => {
  const next = [...items]
  const [removed] = next.splice(from, 1)
  next.splice(to, 0, removed)
  return next
}

const handleAttachmentDragStart = (attachmentId: string) => {
  draggingAttachmentId.value = attachmentId
}

const handleAttachmentDragOver = (attachmentId: string) => {
  dragOverAttachmentId.value = attachmentId
}

const handleAttachmentDragEnd = () => {
  draggingAttachmentId.value = null
  dragOverAttachmentId.value = null
}

const handleAttachmentDrop = async (attachmentId: string) => {
  if (!editingItem.value || !draggingAttachmentId.value) {
    return
  }
  if (draggingAttachmentId.value === attachmentId) {
    handleAttachmentDragEnd()
    return
  }
  const ordered = existingAttachments.value
  const fromIndex = ordered.findIndex((entry) => entry.attachment_id === draggingAttachmentId.value)
  const toIndex = ordered.findIndex((entry) => entry.attachment_id === attachmentId)
  if (fromIndex === -1 || toIndex === -1) {
    handleAttachmentDragEnd()
    return
  }
  const nextOrder = moveInArray(ordered, fromIndex, toIndex)
  await store.reorderAttachments(
    editingItem.value.item_id,
    nextOrder.map((entry) => entry.attachment_id)
  )
  handleAttachmentDragEnd()
}

const handlePendingDragStart = (tempId: string) => {
  draggingPendingId.value = tempId
}

const handlePendingDragOver = (tempId: string) => {
  dragOverPendingId.value = tempId
}

const handlePendingDragEnd = () => {
  draggingPendingId.value = null
  dragOverPendingId.value = null
}

const handlePendingDrop = (tempId: string) => {
  if (!draggingPendingId.value) {
    return
  }
  if (draggingPendingId.value === tempId) {
    handlePendingDragEnd()
    return
  }
  const fromIndex = pendingAttachments.value.findIndex((entry) => entry.temp_id === draggingPendingId.value)
  const toIndex = pendingAttachments.value.findIndex((entry) => entry.temp_id === tempId)
  if (fromIndex === -1 || toIndex === -1) {
    handlePendingDragEnd()
    return
  }
  pendingAttachments.value = moveInArray(pendingAttachments.value, fromIndex, toIndex)
  handlePendingDragEnd()
}

const toDataUrl = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

const handleAttachmentSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  attachmentErrors.value = []

  if (!files.length) {
    return
  }

  const nextAttachments: PendingAttachment[] = []

  for (const file of files) {
    const allowed = allowedAttachmentTypes.some((type) =>
      type.endsWith('/') ? file.type.startsWith(type) : file.type === type
    )
    if (!allowed) {
      attachmentErrors.value.push(t('inventory.attachments.errors.invalidType', { name: file.name }))
      continue
    }
    if (file.size > maxAttachmentSize) {
      attachmentErrors.value.push(t('inventory.attachments.errors.tooLarge', { name: file.name }))
      continue
    }
    const dataUrl = await toDataUrl(file)
    nextAttachments.push({
      temp_id: createId(),
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      data_url: dataUrl
    })
  }

  if (nextAttachments.length) {
    pendingAttachments.value = [...pendingAttachments.value, ...nextAttachments]
  }

  input.value = ''
}

const removePendingAttachment = (tempId: string) => {
  pendingAttachments.value = pendingAttachments.value.filter((entry) => entry.temp_id !== tempId)
}

const removeAttachment = async (attachmentId: string) => {
  await store.removeAttachment(attachmentId)
}

const persistPendingAttachments = async (itemId: string) => {
  if (!pendingAttachments.value.length) {
    return
  }

  const startOrder =
    store.attachments
      .filter((entry) => entry.item_id === itemId)
      .reduce((max, entry) => Math.max(max, entry.sort_order ?? 0), -1) + 1

  await Promise.all(
    pendingAttachments.value.map((attachment, index) =>
      store.addAttachment({
        item_id: itemId,
        file_name: attachment.file_name,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
        data_url: attachment.data_url,
        sort_order: startOrder + index
      })
    )
  )
  pendingAttachments.value = []
}

const handleSubmit = async () => {
  submitError.value = ''
  if (formErrors.value.length > 0) {
    return
  }
  if (props.itemId && !editingItem.value) {
    return
  }

  const shouldReceive = receiptForm.value.quantity_received > 0 && receiptChanged.value
  const receiptPayload = shouldReceive
    ? {
        received_at: receiptForm.value.received_at || new Date().toISOString().slice(0, 10),
        location_id: receiptForm.value.location_id,
        quantity_received: receiptForm.value.quantity_received,
        unit_cost: receiptForm.value.unit_cost,
        employee_name: receiptForm.value.employee_name?.trim() || null
      }
    : null

  if (form.value.pricing_mode === 'MARGIN_PERCENT') {
    form.value.price = derivedPrice.value
  }
  if (form.value.pricing_mode === 'COST_SHEET') {
    form.value.cost = costSheetUnitCost.value
    form.value.price = costSheetUnitPrice.value
    form.value.cost_sheet_total_with_vat = costSheetTotalWithVat.value
    if (!form.value.cost_sheet_entry_id) {
      form.value.cost_sheet_vat_rate = vatRate.value
    }
  }

  let savedId = ''
  try {
    if (editingItem.value) {
      const updated: Item = {
        ...editingItem.value,
        name: form.value.name,
        model: form.value.model?.trim() || null,
        serial_number: form.value.serial_number?.trim() || null,
        description: form.value.description ?? null,
        price: form.value.price,
        cost: form.value.cost,
        category_id: form.value.category_id ?? null,
        location_id: form.value.location_id ?? null,
        item_type: form.value.item_type,
        is_for_maintenance: form.value.is_for_maintenance,
        min_stock_level: form.value.min_stock_level,
        reorder_quantity: form.value.reorder_quantity,
        stock_location: form.value.stock_location,
        sku: form.value.sku ?? null,
        vendor_sku: form.value.vendor_sku ?? null,
        barcode: form.value.barcode ?? null,
        weight: form.value.weight ?? null,
        dimensions: form.value.dimensions ?? null,
        manufacturer: form.value.manufacturer ?? null,
        warranty_period: form.value.warranty_period ?? null,
        unit: form.value.unit?.trim() ? form.value.unit.trim() : null,
        employee_name: form.value.employee_name?.trim() || null,
        pricing_mode: form.value.pricing_mode ?? 'MANUAL',
        margin_percent: form.value.margin_percent ?? null,
        price_override_reason: form.value.price_override_reason?.trim() || null,
        cost_sheet_quantity: form.value.cost_sheet_quantity ?? null,
        cost_sheet_unit_cost: form.value.cost_sheet_unit_cost ?? null,
        cost_sheet_total_with_vat: form.value.cost_sheet_total_with_vat ?? null,
        cost_sheet_vat_rate: form.value.cost_sheet_vat_rate ?? null,
        cost_sheet_entry_id: form.value.cost_sheet_entry_id ?? null
      }

      await store.updateItem(updated)
      if (receiptPayload && receiptPayload.location_id) {
        await store.receiveStock({
          item_id: updated.item_id,
          ...receiptPayload
        })
      }
      await persistPendingAttachments(updated.item_id)
      savedId = updated.item_id
    } else {
      const created = await store.createItem({
        ...form.value,
        model: form.value.model?.trim() || null,
        serial_number: form.value.serial_number?.trim() || null,
        pricing_mode: form.value.pricing_mode ?? 'MANUAL',
        margin_percent: form.value.margin_percent ?? null,
        price_override_reason: form.value.price_override_reason?.trim() || null,
        cost_sheet_quantity: form.value.cost_sheet_quantity ?? null,
        cost_sheet_unit_cost: form.value.cost_sheet_unit_cost ?? null,
        cost_sheet_total_with_vat: form.value.cost_sheet_total_with_vat ?? null,
        cost_sheet_vat_rate: form.value.cost_sheet_vat_rate ?? null,
        cost_sheet_entry_id: form.value.cost_sheet_entry_id ?? null,
        price: form.value.price,
        cost: form.value.cost,
        employee_name: form.value.employee_name?.trim() || null
      })
      if (receiptPayload && receiptPayload.location_id) {
        await store.receiveStock({
          item_id: created.item_id,
          ...receiptPayload
        })
      }
      await persistPendingAttachments(created.item_id)
      savedId = created.item_id
    }
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    const statusMessage = (error as { data?: { statusMessage?: string } })?.data?.statusMessage
    if (status === 409 && statusMessage === 'ITEM_ALREADY_EXISTS' && !editingItem.value) {
      const normalizeKey = (value?: string | null) => (value ?? '').trim().toLowerCase()
      const target = store.items.find(
        (item) =>
          normalizeKey(item.name) === normalizeKey(form.value.name) &&
          normalizeKey(item.model ?? '') === normalizeKey(form.value.model ?? '')
      )
      if (!receiptPayload || !receiptPayload.location_id || receiptPayload.quantity_received <= 0) {
        submitError.value = t('inventory.validation.duplicateItemNeedsReceipt')
        return
      }
      if (!target) {
        submitError.value = t('inventory.validation.duplicateItem')
        return
      }
      await store.receiveStock({
        item_id: target.item_id,
        ...receiptPayload
      })
      await persistPendingAttachments(target.item_id)
      savedId = target.item_id
    } else if (status === 409 && statusMessage === 'ITEM_ALREADY_EXISTS') {
      submitError.value = t('inventory.validation.duplicateItem')
      return
    } else if (status === 409 && statusMessage === 'SKU_ALREADY_EXISTS') {
      submitError.value = t('inventory.validation.skuExists')
      return
    } else if (status === 409 && statusMessage === 'COST_SHEET_ALREADY_USED') {
      submitError.value = t('inventory.validation.costSheetAlreadyUsed')
      return
    } else if (status === 400 && statusMessage === 'COST_SHEET_NOT_FOUND') {
      submitError.value = t('inventory.validation.costSheetNotFound')
      return
    } else {
      submitError.value = t('inventory.validation.saveFailed')
      return
    }
  }

  const wasEditing = Boolean(editingItem.value)
  resetForm()

  setFlashMessage({
    type: 'primary',
    text: wasEditing ? t('inventory.messages.updated') : t('inventory.messages.saved')
  })

  if (savedId) {
    emit('saved', savedId)
  }
  if (props.redirectTo) {
    await router.push(localePath(props.redirectTo))
  }
}

const removeItem = async (itemId: string) => {
  await store.deleteItem(itemId)
  if (editingItem.value?.item_id === itemId) {
    resetForm()
  }
}

onMounted(async () => {
  await loadPermissions()
  if (!store.isLoaded) {
    await store.loadAll()
  }
  if (!settingsStore.isLoaded) {
    await settingsStore.loadAll()
  }
  const marginSetting = settingsStore.getSetting('default_margin_percent')
  if (marginSetting?.setting_value) {
    const parsed = Number(marginSetting.setting_value)
    if (Number.isFinite(parsed)) {
      defaultMarginPercent.value = parsed
    }
  }
  syncFromProps()
  if (!editingItem.value) {
    form.value.margin_percent = defaultMarginPercent.value
  }
  if (!editingItem.value && prefillCostSheetId.value) {
    form.value.pricing_mode = 'COST_SHEET'
    form.value.cost_sheet_entry_id = prefillCostSheetId.value
    const entry = store.costSheets.find((item) => item.cost_sheet_id === prefillCostSheetId.value)
    if (entry) {
      applyCostSheetEntry(entry)
    }
  }
})

watch(
  () => props.itemId,
  () => {
    if (store.isLoaded) {
      syncFromProps()
    }
  }
)

watch(
  () => form.value.cost_sheet_entry_id,
  (nextId) => {
    if (!nextId) {
      return
    }
    const entry = store.costSheets.find((item) => item.cost_sheet_id === nextId)
    if (entry) {
      applyCostSheetEntry(entry)
    }
  }
)

watch(
  () => form.value.pricing_mode,
  (mode) => {
    if (mode !== 'COST_SHEET' && form.value.cost_sheet_entry_id) {
      form.value.cost_sheet_entry_id = null
    }
  }
)
</script>
