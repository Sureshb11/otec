import { SetMetadata } from '@nestjs/common';

export interface PermissionRequirement {
    module: string;
    action: 'canView' | 'canAdd' | 'canEdit' | 'canDelete';
}

export const PERMISSION_KEY = 'required_permission';

/**
 * Decorator to enforce granular permission checks on controller methods.
 * Usage: @RequirePermission('orders', 'canAdd')
 */
export const RequirePermission = (module: string, action: 'canView' | 'canAdd' | 'canEdit' | 'canDelete') =>
    SetMetadata(PERMISSION_KEY, { module, action } as PermissionRequirement);
