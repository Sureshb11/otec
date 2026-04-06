import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ToolInstancesService } from './tool-instances.service';
import { CreateToolInstanceDto, UpdateToolInstanceDto } from './dto/tool-instance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';

@Controller('tool-instances')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ToolInstancesController {
    constructor(private readonly toolInstancesService: ToolInstancesService) { }

    @Get()
    @RequirePermission('tools', 'canView')
    findAll() {
        return this.toolInstancesService.findAll();
    }

    @Get('active')
    @RequirePermission('tools', 'canView')
    findActive() {
        return this.toolInstancesService.findActive();
    }

    @Get(':id')
    @RequirePermission('tools', 'canView')
    findOne(@Param('id') id: string) {
        return this.toolInstancesService.findOne(id);
    }

    @Post()
    @RequirePermission('tools', 'canAdd')
    create(@Body() createDto: CreateToolInstanceDto) {
        return this.toolInstancesService.create(createDto);
    }

    @Patch(':id')
    @RequirePermission('tools', 'canEdit')
    update(@Param('id') id: string, @Body() updateDto: UpdateToolInstanceDto) {
        return this.toolInstancesService.update(id, updateDto);
    }

    @Patch(':id/stop')
    @RequirePermission('tools', 'canEdit')
    stop(@Param('id') id: string) {
        return this.toolInstancesService.stop(id);
    }
}
