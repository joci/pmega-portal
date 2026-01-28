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
  | 'maintenance'

export const rolePermissions: Record<RoleKey, PermissionKey[]> = {
  admin: [...permissionList],
  manager: [
    'inventory.view',
    'inventory.edit',
    'inventory.field.price.view',
    'inventory.field.price.edit',
    'inventory.cost_sheet.remove',
    'inventory.locations.manage'
  ],
  staff: [
    'inventory.view',
    'inventory.edit',
    'inventory.field.price.view',
    'inventory.field.price.edit',
    'inventory.cost_sheet.remove',
    'inventory.locations.manage'
  ],
  viewer: ['inventory.view'],
  technician: [
    'inventory.view',
    'maintenance.view',
    'maintenance.edit',
    'maintenance.parts.request',
    'maintenance.parts.use'
  ],
  sales: [
    'inventory.view',
    'inventory.edit',
    'sales.view',
    'sales.create',
    'maintenance.view',
    'maintenance.edit'
  ],
  maintenance_receiver: [
    'inventory.view',
    'inventory.edit',
    'maintenance.view',
    'maintenance.edit'
  ],
  maintenance: ['maintenance.view', 'maintenance.parts.request']
}

export const getRolePermissions = (role: string) => {
  if (role in rolePermissions) {
    return rolePermissions[role as RoleKey]
  }
  return rolePermissions.viewer
}
