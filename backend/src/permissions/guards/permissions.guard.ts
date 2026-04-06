import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, PermissionRequirement } from '../decorators/require-permission.decorator';
import { PermissionsService } from '../permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private permissionsService: PermissionsService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requirement = this.reflector.get<PermissionRequirement>(
            PERMISSION_KEY,
            context.getHandler(),
        );

        // If no permission requirement is set, allow access
        if (!requirement) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Access denied. User not authenticated.');
        }

        // Extract role IDs from the user
        const userRoles = Array.isArray(user.roles) ? user.roles : [];
        const roleIds = userRoles.map((role: any) =>
            typeof role === 'string' ? role : role.id || role,
        );

        if (roleIds.length === 0) {
            throw new ForbiddenException('Access denied. No roles assigned.');
        }

        // Check if any of the user's roles has the required permission
        const hasPermission = await this.permissionsService.checkPermission(
            roleIds,
            requirement.module,
            requirement.action,
        );

        if (!hasPermission) {
            throw new ForbiddenException(
                `Access denied. You do not have '${requirement.action}' permission for the '${requirement.module}' module.`,
            );
        }

        return true;
    }
}
