import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import { User } from './user.entity';
import { Role, RoleType } from '../roles/role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async create(userData: Partial<User>, roleName: RoleType = RoleType.USER): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
    });
    
    // Assign default role if not admin
    const role = await this.rolesRepository.findOne({ where: { name: roleName } });
    if (role) {
      user.roles = [role];
    }
    
    return this.usersRepository.save(user);
  }

  async createWithRoles(userData: Partial<User>, roleIds: string[]): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
    });
    
    // Assign specified roles
    const roles = await this.rolesRepository.findBy({ id: In(roleIds) });
    user.roles = roles.length > 0 ? roles : [];
    
    // If no valid roles found, assign default 'user' role
    if (user.roles.length === 0) {
      const defaultRole = await this.rolesRepository.findOne({ where: { name: RoleType.USER } });
      if (defaultRole) {
        user.roles = [defaultRole];
      }
    }
    
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ relations: ['roles'] });
  }

  async findOne(id: string): Promise<User> {
    return this.usersRepository.findOne({ 
      where: { id },
      relations: ['roles'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { email },
      relations: ['roles'],
    });
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    await this.usersRepository.update(id, userData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async updateUserRoles(userId: string, roleIds: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) {
      throw new Error('User not found');
    }

    const roles = await this.rolesRepository.findBy({ id: In(roleIds) });
    user.roles = roles;
    return this.usersRepository.save(user);
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
      },
    );
  }
}
