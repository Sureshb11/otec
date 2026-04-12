import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import type { PermissionAction } from '../config/permissions';

/**
 * Hook that exposes a `can(module, action)` check backed by the
 * permissions matrix stored in authStore. Admin users always pass.
 *
 * Usage:
 *   const { can } = usePermissions();
 *   if (can('orders', 'add')) { ... }
 */
export const usePermissions = () => {
  const can = useAuthStore((s) => s.can);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);

  /**
   * Check whether the current user can perform `action` on `module`.
   * Returns true for super_admin, true when no permissions configured for the module
   * (fail-open), and false only when the module has explicit deny.
   */
  const check = useCallback(
    (module: string, action: PermissionAction) => can(module, action),
    [can],
  );

  return {
    can: check,
    isAdmin: isAdmin(),
    isSuperAdmin: isSuperAdmin(),
  };
};
