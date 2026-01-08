import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private rolesService: RolesService,
  ) {
    // Seed roles on initialization (async, won't block)
    this.rolesService.seedRoles().catch(console.error);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const userWithRoles = await this.usersService.findOne(user.id);
    const payload = { 
      email: user.email, 
      sub: user.id,
      roles: userWithRoles.roles?.map((role) => role.name) || [],
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: userWithRoles.roles?.map((role) => role.name) || [],
      },
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
}
