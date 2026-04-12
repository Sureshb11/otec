/**
 * Canonical list of modules and the actions each one supports.
 *
 * MIRROR of backend/src/permissions/modules.config.ts. When you add a new
 * module, update BOTH files. The role builder UI and the `usePermissions`
 * hook both read from this list, so it MUST stay in sync with the backend.
 */

export type PermissionAction = 'view' | 'add' | 'edit' | 'delete';

export interface ModuleDefinition {
  /** Stable lowercase key. Matches Permission.moduleName on the backend. */
  key: string;
  /** Display label shown in the role builder UI. */
  label: string;
  /** Optional UI grouping. */
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

/** Friendly action label for the matrix column header. */
export const ACTION_LABEL: Record<PermissionAction, string> = {
  view: 'View',
  add: 'Add',
  edit: 'Edit',
  delete: 'Delete',
};
