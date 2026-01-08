import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

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

