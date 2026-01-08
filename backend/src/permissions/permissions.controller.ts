import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('role/:roleId')
  @Roles('admin')
  getPermissionsByRole(@Param('roleId') roleId: string) {
    return this.permissionsService.findByRoleId(roleId);
  }

  @Post('role/:roleId/defaults')
  @Roles('admin')
  createDefaultPermissions(@Param('roleId') roleId: string) {
    return this.permissionsService.createDefaultPermissions(roleId);
  }

  @Put('role/:roleId/bulk')
  @Roles('admin')
  bulkUpdatePermissions(
    @Param('roleId') roleId: string,
    @Body() permissions: any[],
  ) {
    return this.permissionsService.bulkUpdatePermissions(roleId, permissions);
  }
}

