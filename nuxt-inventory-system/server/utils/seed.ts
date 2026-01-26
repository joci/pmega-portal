import type { PrismaClient } from '@prisma/client'

const defaultCategories = [
  {
    category_id: 'cat-speakers-001',
    name: 'Speakers',
    description: 'Audio speakers and sound systems',
    category_type: 'PRODUCT' as const
  },
  {
    category_id: 'cat-tvs-001',
    name: 'Televisions',
    description: 'TVs and displays',
    category_type: 'PRODUCT' as const
  },
  {
    category_id: 'cat-fridges-001',
    name: 'Refrigerators',
    description: 'Cooling appliances',
    category_type: 'PRODUCT' as const
  },
  {
    category_id: 'cat-keyboards-001',
    name: 'Music Keyboards',
    description: 'Musical instruments',
    category_type: 'PRODUCT' as const
  },
  {
    category_id: 'cat-spare-parts-001',
    name: 'Spare Parts',
    description: 'Repair and replacement parts',
    category_type: 'SPARE_PART' as const
  },
  {
    category_id: 'cat-accessories-001',
    name: 'Accessories',
    description: 'Cables, remotes, stands',
    category_type: 'BOTH' as const
  }
]

const defaultLocations = [
  {
    location_id: 'store-location-001',
    name: 'Main Store',
    location_type: 'STORE' as const
  },
  {
    location_id: 'workshop-location-001',
    name: 'Repair Workshop',
    location_type: 'WORKSHOP' as const
  }
]

const defaultUnits = [
  { unit_id: 'unit-piece', name: 'Piece' },
  { unit_id: 'unit-roll', name: 'Roll' },
  { unit_id: 'unit-box', name: 'Box' },
  { unit_id: 'unit-set', name: 'Set' }
]

const defaultSettings = [
  {
    setting_id: 'setting-sync-001',
    setting_key: 'sync_interval_minutes',
    setting_value: '5',
    setting_type: 'NUMBER' as const,
    description: 'Sync interval in minutes'
  },
  {
    setting_id: 'setting-sync-002',
    setting_key: 'auto_sync_enabled',
    setting_value: 'true',
    setting_type: 'BOOLEAN' as const,
    description: 'Enable automatic background sync'
  },
  {
    setting_id: 'setting-inv-001',
    setting_key: 'low_stock_threshold',
    setting_value: '5',
    setting_type: 'NUMBER' as const,
    description: 'Low stock alert threshold'
  },
  {
    setting_id: 'setting-app-001',
    setting_key: 'app_location_id',
    setting_value: 'store-location-001',
    setting_type: 'STRING' as const,
    description: 'Current application location id'
  },
  {
    setting_id: 'setting-app-002',
    setting_key: 'tax_rate',
    setting_value: '0.15',
    setting_type: 'NUMBER' as const,
    description: 'Default tax rate (15%)'
  },
  {
    setting_id: 'setting-app-003',
    setting_key: 'business_name',
    setting_value: 'Omega Electronics PLC',
    setting_type: 'STRING' as const,
    description: 'Registered business name'
  },
  {
    setting_id: 'setting-app-004',
    setting_key: 'supplier_tin',
    setting_value: '',
    setting_type: 'STRING' as const,
    description: 'Supplier TIN number'
  },
  {
    setting_id: 'setting-app-005',
    setting_key: 'vat_registration_date',
    setting_value: '',
    setting_type: 'DATE' as const,
    description: 'VAT registration date'
  },
  {
    setting_id: 'setting-app-006',
    setting_key: 'vat_registration_no',
    setting_value: '010901',
    setting_type: 'STRING' as const,
    description: 'Supplier VAT registration number'
  },
  {
    setting_id: 'setting-pricing-001',
    setting_key: 'default_margin_percent',
    setting_value: '40',
    setting_type: 'NUMBER' as const,
    description: 'Default margin percentage for pricing'
  }
]

export const ensureCoreSeed = async (prisma: PrismaClient) => {
  const [categoryCount, locationCount, unitCount, settingsCount] = await prisma.$transaction([
    prisma.category.count(),
    prisma.location.count(),
    prisma.unit.count(),
    prisma.setting.count()
  ])

  if (categoryCount === 0) {
    await prisma.category.createMany({ data: defaultCategories })
  }

  if (locationCount === 0) {
    await prisma.location.createMany({ data: defaultLocations })
  }

  if (unitCount === 0) {
    await prisma.unit.createMany({ data: defaultUnits })
  }

  if (settingsCount === 0) {
    await prisma.setting.createMany({ data: defaultSettings })
  }
}
