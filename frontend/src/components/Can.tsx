import type { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import type { PermissionAction } from '../config/permissions';

interface CanProps {
  /** Module key from the canonical MODULES list (e.g. 'orders'). */
  module: string;
  /** Action to check (e.g. 'view', 'add', 'edit', 'delete'). */
  action: PermissionAction;
  /** Content shown when the user HAS the permission. */
  children: ReactNode;
  /** Optional fallback rendered when the user is denied. Defaults to null (hide). */
  fallback?: ReactNode;
}

/**
 * Declarative permission gate.
 *
 * Usage:
 *   <Can module="orders" action="add">
 *     <button>+ New Order</button>
 *   </Can>
 */
const Can = ({ module, action, children, fallback = null }: CanProps) => {
  const { can } = usePermissions();
  return can(module, action) ? <>{children}</> : <>{fallback}</>;
};

export default Can;
