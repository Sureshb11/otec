import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import type { PermissionAction } from '../config/permissions';

interface PermissionRouteProps {
  /** Module key (e.g. 'orders'). */
  module: string;
  /** Action to gate on — defaults to 'view'. */
  action?: PermissionAction;
  /** Content rendered when the user has the permission. */
  children: ReactNode;
  /** Where to redirect when denied. Defaults to '/dashboard'. */
  redirectTo?: string;
}

/**
 * Route-level permission gate.
 *
 * Wrap around the page element inside a `<Route>` to redirect
 * users who lack permission for the given module + action.
 *
 * Usage:
 *   <Route path="/orders" element={
 *     <PermissionRoute module="orders">
 *       <MainLayout><Orders /></MainLayout>
 *     </PermissionRoute>
 *   } />
 */
const PermissionRoute = ({
  module,
  action = 'view',
  children,
  redirectTo = '/dashboard',
}: PermissionRouteProps) => {
  const { can } = usePermissions();

  if (!can(module, action)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default PermissionRoute;
