import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) { }

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.find();
  }

  async findOne(id: string): Promise<Role> {
    return this.rolesRepository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Role> {
    return this.rolesRepository.findOne({ where: { name } });
  }

  async create(roleData: Partial<Role>): Promise<Role> {
    const role = this.rolesRepository.create({
      ...roleData,
      name: roleData.name.toLowerCase()
    });
    return this.rolesRepository.save(role);
  }

  async update(id: string, roleData: Partial<Role>): Promise<Role> {
    if (roleData.name) {
      roleData.name = roleData.name.toLowerCase();
    }
    await this.rolesRepository.update(id, roleData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.rolesRepository.delete(id);
  }

  async seedRoles(): Promise<void> {
    const roles = [
      { name: 'admin', description: 'Administrator with full access' },
      { name: 'user', description: 'Regular user with limited access' },
      { name: 'manager', description: 'Manager with elevated permissions' },
      { name: 'employee', description: 'Employee with standard access' },
      { name: 'driver', description: 'Driver with delivery/transport access' },
      { name: 'vendor', description: 'Vendor with supplier access' },
    ];

    for (const roleData of roles) {
      const existingRole = await this.findByName(roleData.name);
      if (!existingRole) {
        try {
          await this.create(roleData);
          console.log(`Seeded role: ${roleData.name}`);
        } catch (error) {
          if (error.code === '23505') { // Unique constraint violation
            console.log(`Role ${roleData.name} already exists (caught duplicate error)`);
          } else {
            throw error;
          }
        }
      }
    }
  }
}
