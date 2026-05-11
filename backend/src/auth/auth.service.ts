import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import { MailerService } from '../common/mailer/mailer.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private rolesService: RolesService,
    private permissionsService: PermissionsService,
    private mailerService: MailerService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    console.log('🔍 Validate user attempt:', {
      email,
      hasPassword: !!password,
      passwordLength: password?.length,
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
      tv: userWithRoles.tokenVersion ?? 0,
    };

    // Merge permissions from all of the user's roles.
    // For each module, if ANY role grants a capability, the user has it.
    // super_admin bypasses all checks — empty map signals "full access" on frontend.
    const isSuperAdmin = roleNames.includes('super_admin');
    const permissionsMap: Record<
      string,
      { canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }
    > = {};

    if (!isSuperAdmin) {
      for (const role of userWithRoles.roles || []) {
        const rolePerms = await this.permissionsService.findByRoleId(role.id);
        for (const perm of rolePerms) {
          const key = perm.moduleName.toLowerCase();
          if (!permissionsMap[key]) {
            permissionsMap[key] = {
              canView: false,
              canAdd: false,
              canEdit: false,
              canDelete: false,
            };
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
    const genericResponse = {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return genericResponse;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

    await this.usersService.setPasswordResetToken(user.email, resetToken, resetTokenExpires);

    const resetUrl = `${
      process.env.FRONTEND_URL || 'http://localhost:5173'
    }/reset-password?token=${resetToken}`;

    await this.mailerService.send({
      to: user.email,
      subject: 'Reset your OTEC password',
      text: `A password reset was requested for your account. Open the link below to set a new password (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
      html: `<p>A password reset was requested for your account.</p><p><a href="${resetUrl}">Reset your password</a> (link expires in 1 hour).</p><p>If you didn't request this, you can ignore this email.</p>`,
    });

    if (process.env.NODE_ENV !== 'production') {
      return { ...genericResponse, token: resetToken };
    }
    return genericResponse;
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

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    await this.usersService.changePassword(userId, currentPassword, newPassword);
    return { message: 'Password updated successfully' };
  }
}
