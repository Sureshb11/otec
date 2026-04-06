import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) { }

  /**
   * Check if any of the given roles has the specified permission for a module.
   * Returns true if permission is granted, false otherwise.
   * If no permissions exist at all for the module, defaults to allowing access.
   */
  async checkPermission(
    roleIds: string[],
    moduleName: string,
    action: 'canView' | 'canAdd' | 'canEdit' | 'canDelete',
  ): Promise<boolean> {
    if (!roleIds || roleIds.length === 0) return false;

    try {
      const permission = await this.permissionsRepository
        .createQueryBuilder('p')
        .where('p.roleId IN (:...roleIds)', { roleIds })
        .andWhere('LOWER(p.moduleName) = LOWER(:module)', { module: moduleName })
        .andWhere(`p.${action} = :value`, { value: true })
        .getOne();

      // If we found a matching permission, access is granted
      if (permission) return true;

      // Check if any permissions exist for this module at all
      const anyPermission = await this.permissionsRepository
        .createQueryBuilder('p')
        .where('p.roleId IN (:...roleIds)', { roleIds })
        .andWhere('LOWER(p.moduleName) = LOWER(:module)', { module: moduleName })
        .getOne();

      // If no permissions are configured for this module, allow access (fail-open for unconfigured modules)
      if (!anyPermission) return true;

      // Permissions exist but this specific action is denied
      return false;
    } catch (error) {
      console.error('Permission check error:', error.message);
      // Fail-open on errors to prevent lockout
      return true;
    }
  }

  async findByRoleId(roleId: string): Promise<Permission[]> {
    return this.permissionsRepository.find({
      where: { roleId },
      order: { moduleName: 'ASC', feature: 'ASC' },
    });
  }

  async updatePermission(
    permissionId: string,
    updates: Partial<Permission>,
  ): Promise<Permission> {
    await this.permissionsRepository.update(permissionId, updates);
    return this.permissionsRepository.findOne({ where: { id: permissionId } });
  }

  async bulkUpdatePermissions(
    roleId: string,
    permissions: Array<{
      id?: string;
      moduleName: string;
      feature: string;
      canView: boolean;
      canAdd: boolean;
      canEdit: boolean;
      canDelete: boolean;
    }>,
  ): Promise<Permission[]> {
    // Delete existing permissions for this role
    await this.permissionsRepository.delete({ roleId });

    // Create new permissions
    const newPermissions = permissions.map((perm) =>
      this.permissionsRepository.create({
        ...perm,
        roleId,
      }),
    );

    return this.permissionsRepository.save(newPermissions);
  }

  async createDefaultPermissions(roleId: string): Promise<Permission[]> {
    const defaultPermissions = [
      // Dashboard
      {
        moduleName: 'Dashboard',
        feature: 'Customise Dashboard',
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
      },
      // Insights
      {
        moduleName: 'Insights',
        feature: 'Report download',
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
      },
      // Opportunities
      {
        moduleName: 'Opportunities',
        feature: 'Add to another job',
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
      },
      {
        moduleName: 'Opportunities',
        feature: 'Applications (Candidates)',
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
      },
      {
        moduleName: 'Opportunities',
        feature: 'Approve / decline a new requisition',
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
      },
      {
        moduleName: 'Opportunities',
        feature: 'Assign / Change Primary Recruiter',
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
      },
      {
        moduleName: 'Opportunities',
        feature: 'Change Interview Stage',
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
      },
      {
        moduleName: 'Opportunities',
        feature: 'Change job status',
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
      },
    ];

    const permissions = defaultPermissions.map((perm) =>
      this.permissionsRepository.create({
        ...perm,
        roleId,
      }),
    );

    return this.permissionsRepository.save(permissions);
  }
}

