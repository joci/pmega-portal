export const permissionList = [
  'settings.view',
  'settings.edit',
  'settings.field.tax_rate.view',
  'settings.field.tax_rate.edit',
  'inventory.view',
  'inventory.edit',
  'inventory.field.price.view',
  'inventory.field.price.edit',
  'inventory.field.cost.view',
  'inventory.cost_sheet.remove',
  'inventory.locations.manage',
  'sales.view',
  'sales.create',
  'maintenance.view',
  'maintenance.edit',
  'maintenance.parts.request',
  'maintenance.parts.use'
] as const

export type PermissionKey = (typeof permissionList)[number]

export type RoleKey =
  | 'admin'
  | 'manager'
  | 'staff'
  | 'viewer'
  | 'technician'
  | 'sales'
  | 'maintenance_receiver'

export const rolePermissions: Record<RoleKey, PermissionKey[]> = {
  admin: [...permissionList],
  manager: [
    'settings.view',
    'settings.edit',
    'settings.field.tax_rate.view',
    'inventory.view',
    'inventory.edit',
    'inventory.field.price.view',
    'inventory.field.price.edit',
    'inventory.field.cost.view',
    'inventory.cost_sheet.remove',
    'sales.view',
    'sales.create',
    'maintenance.view',
    'maintenance.edit',
    'maintenance.parts.request',
    'maintenance.parts.use'
  ],
  staff: [
    'settings.view',
    'inventory.view',
    'inventory.edit',
    'inventory.field.price.view',
    'sales.view',
    'sales.create',
    'maintenance.view'
  ],
  viewer: ['inventory.view'],
  technician: [
    'inventory.view',
    'maintenance.view',
    'maintenance.edit',
    'maintenance.parts.request',
    'maintenance.parts.use'
  ],
  sales: ['inventory.view', 'sales.view', 'sales.create', 'maintenance.view'],
  maintenance_receiver: [
    'inventory.view',
    'maintenance.view',
    'maintenance.edit',
    'maintenance.parts.request'
  ]
}

export const getRolePermissions = (role: string) => {
  if (role in rolePermissions) {
    return rolePermissions[role as RoleKey]
  }
  return rolePermissions.viewer
}
