/**
 * Canonical list of modules and the actions each one supports.
 *
 * This is the SINGLE SOURCE OF TRUTH for the permission system. The frontend
 * mirrors this list at frontend/src/config/permissions.ts. When a new module
 * is added, update BOTH files (or generate one from the other).
 *
 * Module keys are matched case-insensitively against Permission.moduleName,
 * and against the first argument to @RequirePermission(module, action).
 */

export type PermissionAction = 'view' | 'add' | 'edit' | 'delete';

export interface ModuleDefinition {
  /** Stable lowercase key. Used in @RequirePermission and Permission.moduleName. */
  key: string;
  /** Display label for the role-builder UI. */
  label: string;
  /** Optional UI grouping (Main / Administration / etc.). */
  group: 'main' | 'administration';
  /** Which actions are meaningful for this module. */
  actions: PermissionAction[];
}

export const MODULES: ModuleDefinition[] = [
  // Main menu
  { key: 'dashboard',   label: 'Dashboard',   group: 'main',           actions: ['view'] },
  { key: 'operations',  label: 'Operations',  group: 'main',           actions: ['view', 'add', 'edit', 'delete'] },
  { key: 'orders',      label: 'Orders',      group: 'main',           actions: ['view', 'add', 'edit', 'delete'] },
  { key: 'inventory',   label: 'Inventory',   group: 'main',           actions: ['view', 'add', 'edit', 'delete'] },
  { key: 'maintenance', label: 'Maintenance', group: 'main',           actions: ['view', 'add', 'edit', 'delete'] },
  { key: 'customers',   label: 'Customers',   group: 'main',           actions: ['view', 'add', 'edit', 'delete'] },
  { key: 'locations',   label: 'Locations',   group: 'main',           actions: ['view', 'add', 'edit', 'delete'] },
  { key: 'rigs',        label: 'Rigs',        group: 'main',           actions: ['view', 'add', 'edit', 'delete'] },
  { key: 'reports',     label: 'Reports',     group: 'main',           actions: ['view'] },

  // Administration
  { key: 'users',       label: 'Users',       group: 'administration', actions: ['view', 'add', 'edit', 'delete'] },
  { key: 'roles',       label: 'Roles',       group: 'administration', actions: ['view', 'add', 'edit', 'delete'] },
];

/** Quick lookup by module key. */
export const MODULE_BY_KEY: Record<string, ModuleDefinition> = MODULES.reduce(
  (acc, m) => {
    acc[m.key] = m;
    return acc;
  },
  {} as Record<string, ModuleDefinition>,
);

/** Map a PermissionAction to the boolean column on the Permission entity. */
export const ACTION_COLUMN: Record<PermissionAction, 'canView' | 'canAdd' | 'canEdit' | 'canDelete'> = {
  view: 'canView',
  add: 'canAdd',
  edit: 'canEdit',
  delete: 'canDelete',
};
