import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { ToolsService } from './tools.service';
import { CreateToolDto, UpdateToolDto } from './dto/tool.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';

@Controller('tools')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ToolsController {
    constructor(private readonly toolsService: ToolsService) { }

    @Get()
    @RequirePermission('tools', 'canView')
    findAll() {
        return this.toolsService.findAll();
    }

    @Get('available')
    @RequirePermission('tools', 'canView')
    findAvailable() {
        return this.toolsService.findAvailable();
    }

    @Get(':id')
    @RequirePermission('tools', 'canView')
    findOne(@Param('id') id: string) {
        return this.toolsService.findOne(id);
    }

    @Post()
    @RequirePermission('tools', 'canAdd')
    create(@Body() createToolDto: CreateToolDto) {
        return this.toolsService.create(createToolDto);
    }

    @Patch(':id')
    @RequirePermission('tools', 'canEdit')
    update(@Param('id') id: string, @Body() updateToolDto: UpdateToolDto) {
        return this.toolsService.update(id, updateToolDto);
    }

    @Delete(':id')
    @RequirePermission('tools', 'canDelete')
    remove(@Param('id') id: string) {
        return this.toolsService.remove(id);
    }
}
