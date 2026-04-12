import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private rolesService: RolesService,
    private permissionsService: PermissionsService,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    console.log('🔍 Validate user attempt:', {
      email,
      hasPassword: !!password,
      passwordLength: password?.length
    });
    
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      console.warn('❌ User not found in database:', email);
      return null;
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);
    if (isPasswordMatching) {
      console.log('✅ Password matched for user:', email);
      const { password, ...result } = user;
      return result;
    }

    console.warn('❌ Password mismatch for user:', email);
    return null;
  }

  async login(user: any) {
    const userWithRoles = await this.usersService.findOne(user.id);
    const roleNames = userWithRoles.roles?.map((role) => role.name) || [];

    const payload = {
      email: user.email,
      sub: user.id,
      roles: roleNames,
    };

    // Merge permissions from all of the user's roles.
    // For each module, if ANY role grants a capability, the user has it.
    // super_admin bypasses all checks — empty map signals "full access" on frontend.
    const isSuperAdmin = roleNames.includes('super_admin');
    const permissionsMap: Record<string, { canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }> = {};

    if (!isSuperAdmin) {
      for (const role of userWithRoles.roles || []) {
        const rolePerms = await this.permissionsService.findByRoleId(role.id);
        for (const perm of rolePerms) {
          const key = perm.moduleName.toLowerCase();
          if (!permissionsMap[key]) {
            permissionsMap[key] = { canView: false, canAdd: false, canEdit: false, canDelete: false };
          }
          if (perm.canView) permissionsMap[key].canView = true;
          if (perm.canAdd) permissionsMap[key].canAdd = true;
          if (perm.canEdit) permissionsMap[key].canEdit = true;
          if (perm.canDelete) permissionsMap[key].canDelete = true;
        }
      }
    }

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roleNames,
      },
      permissions: permissionsMap,
    };
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }
    const user = await this.usersService.create(userData);
    return this.login(user);
  }

  async requestPasswordReset(email: string): Promise<{ message: string; token?: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // Token expires in 1 hour

    await this.usersService.setPasswordResetToken(email, resetToken, resetTokenExpires);

    // In production, send email with reset link
    // For now, return token in response (remove in production)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    console.log('Password reset link:', resetUrl); // Remove in production

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
      token: resetToken, // Remove in production - only for development
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      await this.usersService.resetPassword(token, newPassword);
      return { message: 'Password has been reset successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async getCurrentUser(userId: string) {
    return this.usersService.findOne(userId);
  }
}
