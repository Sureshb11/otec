import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';
import { AuditService } from '../common/audit/audit.service';
import * as bcrypt from 'bcryptjs';

export interface Actor {
  id?: string;
  email?: string;
}

type SafeUser = Omit<User, 'password' | 'resetPasswordToken' | 'resetPasswordExpires'>;

function sanitize(user: User): SafeUser {
  if (!user) return user as any;
  const { password, resetPasswordToken, resetPasswordExpires, ...safe } = user;
  return safe as SafeUser;
}

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private readonly audit: AuditService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdminUser();
  }

  async create(
    userData: Partial<User>,
    roleName: string = 'user',
    actor?: Actor,
  ): Promise<SafeUser> {
    return this.createInternal(userData, { roleName }, actor);
  }

  async createWithRoles(
    userData: Partial<User>,
    roleIds: string[],
    actor?: Actor,
  ): Promise<SafeUser> {
    return this.createInternal(userData, { roleIds }, actor);
  }

  private async createInternal(
    userData: Partial<User>,
    opts: { roleIds?: string[]; roleName?: string },
    actor?: Actor,
  ): Promise<SafeUser> {
    const email = userData.email?.trim().toLowerCase();
    if (!email) {
      throw new ConflictException('email is required');
    }

    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.usersRepository.create({
      ...userData,
      email,
      password: hashedPassword,
    });

    user.roles = await this.resolveRoles(opts);

    const saved = await this.usersRepository.save(user);
    await this.audit.record({
      action: 'user.create',
      resource: 'user',
      resourceId: saved.id,
      actorId: actor?.id,
      actorEmail: actor?.email,
      metadata: { email: saved.email, roles: saved.roles?.map((r) => r.name) ?? [] },
    });
    return sanitize(saved);
  }

  private async resolveRoles(opts: { roleIds?: string[]; roleName?: string }): Promise<Role[]> {
    if (opts.roleIds && opts.roleIds.length > 0) {
      const roles = await this.rolesRepository.findBy({ id: In(opts.roleIds) });
      if (roles.length > 0) return roles;
    }
    const fallback = await this.rolesRepository.findOne({
      where: { name: opts.roleName ?? 'user' },
    });
    return fallback ? [fallback] : [];
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.usersRepository.find({ relations: ['roles'] });
    return users.map(sanitize);
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    return sanitize(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email?.trim().toLowerCase() },
      relations: ['roles'],
    });
  }

  async update(id: string, userData: Partial<User>, actor?: Actor): Promise<SafeUser> {
    if (userData.email) {
      userData.email = userData.email.trim().toLowerCase();
      const existing = await this.usersRepository.findOne({ where: { email: userData.email } });
      if (existing && existing.id !== id) {
        throw new ConflictException('A user with this email already exists');
      }
    }
    const passwordChanged = Boolean(userData.password);
    if (passwordChanged) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    await this.usersRepository.update(id, userData);
    if (passwordChanged) {
      await this.usersRepository.increment({ id }, 'tokenVersion', 1);
    }
    await this.audit.record({
      action: 'user.update',
      resource: 'user',
      resourceId: id,
      actorId: actor?.id,
      actorEmail: actor?.email,
      metadata: { fields: Object.keys(userData).filter((k) => k !== 'password'), passwordChanged },
    });
    return this.findOne(id);
  }

  async remove(id: string, actor?: Actor): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({ where: { id }, relations: ['roles'] });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isActive = false;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    const saved = await this.usersRepository.save(user);
    await this.audit.record({
      action: 'user.deactivate',
      resource: 'user',
      resourceId: id,
      actorId: actor?.id,
      actorEmail: actor?.email,
      metadata: { email: user.email },
    });
    return sanitize(saved);
  }

  async updateUserRoles(userId: string, roleIds: string[], actor?: Actor): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previous = user.roles?.map((r) => r.name) ?? [];
    const roles = await this.rolesRepository.findBy({ id: In(roleIds) });
    user.roles = roles;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    const saved = await this.usersRepository.save(user);
    await this.audit.record({
      action: 'user.roles.update',
      resource: 'user',
      resourceId: userId,
      actorId: actor?.id,
      actorEmail: actor?.email,
      metadata: { previous, next: roles.map((r) => r.name) },
    });
    return sanitize(saved);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      throw new BadRequestException('Current password is incorrect');
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await this.usersRepository.save(user);
    await this.audit.record({
      action: 'user.password.change',
      resource: 'user',
      resourceId: userId,
      actorId: userId,
      actorEmail: user.email,
    });
  }

  async setPasswordResetToken(email: string, token: string, expires: Date): Promise<void> {
    await this.usersRepository.update(
      { email },
      { resetPasswordToken: token, resetPasswordExpires: expires },
    );
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: MoreThan(new Date()),
      },
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.findByResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(
      { id: user.id },
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        tokenVersion: (user.tokenVersion ?? 0) + 1,
      },
    );
    await this.audit.record({
      action: 'user.password.reset',
      resource: 'user',
      resourceId: user.id,
      actorId: user.id,
      actorEmail: user.email,
    });
  }

  async seedAdminUser(): Promise<void> {
    const adminEmail = 'admin@otec.com';
    const existingAdmin = await this.findByEmail(adminEmail);

    if (!existingAdmin) {
      console.log('🌱 Seeding admin user...');
      try {
        await this.create(
          {
            email: adminEmail,
            password: 'admin123!', // Helper method will hash this
            firstName: 'System',
            lastName: 'Admin',
            isActive: true,
          },
          'admin',
        );
        console.log('✅ Admin user seeded successfully');
      } catch (error) {
        console.error('❌ Failed to seed admin user:', error);
      }
    } else {
      console.log('ℹ️ Admin user already exists, skipping seeding.');
    }
  }
}
