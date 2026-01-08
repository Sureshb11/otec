import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleType } from './role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.find();
  }

  async findOne(id: string): Promise<Role> {
    return this.rolesRepository.findOne({ where: { id } });
  }

  async findByName(name: RoleType): Promise<Role> {
    return this.rolesRepository.findOne({ where: { name } });
  }

  async create(roleData: Partial<Role>): Promise<Role> {
    const role = this.rolesRepository.create(roleData);
    return this.rolesRepository.save(role);
  }

  async update(id: string, roleData: Partial<Role>): Promise<Role> {
    await this.rolesRepository.update(id, roleData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.rolesRepository.delete(id);
  }

  async seedRoles(): Promise<void> {
    const roles = [
      { name: RoleType.ADMIN, description: 'Administrator with full access' },
      { name: RoleType.USER, description: 'Regular user with limited access' },
      { name: RoleType.MANAGER, description: 'Manager with elevated permissions' },
      { name: RoleType.EMPLOYEE, description: 'Employee with standard access' },
      { name: RoleType.DRIVER, description: 'Driver with delivery/transport access' },
      { name: RoleType.VENDOR, description: 'Vendor with supplier access' },
    ];

    for (const roleData of roles) {
      const existingRole = await this.findByName(roleData.name);
      if (!existingRole) {
        await this.create(roleData);
      }
    }
  }
}
