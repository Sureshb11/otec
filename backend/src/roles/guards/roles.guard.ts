import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied. User not authenticated.');
    }

    // Handle both array of role names and array of role objects
    const userRoles = Array.isArray(user.roles) 
      ? user.roles.map((role: any) => (typeof role === 'string' ? role : role.name || role))
      : [];
    
    // Debug logging (remove in production)
    console.log('🔐 RolesGuard Debug:', {
      userId: user.userId || user.id,
      email: user.email,
      userRoles: userRoles,
      requiredRoles: requiredRoles,
      hasRequiredRole: requiredRoles.some((role) => userRoles.includes(role)),
    });
    
    if (userRoles.length === 0) {
      throw new ForbiddenException(
        `Access denied. User has no roles assigned. User ID: ${user.userId || user.id}, Email: ${user.email}`
      );
    }
    
    const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(', ')}. Your roles: ${userRoles.join(', ')}. User ID: ${user.userId || user.id}, Email: ${user.email}`
      );
    }
    
    return true;
  }
}
