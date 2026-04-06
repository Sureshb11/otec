import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
} from '@nestjs/common';
import { RigsService } from './rigs.service';
import { CreateRigDto, UpdateRigDto } from './dto/rig.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';

@Controller('rigs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RigsController {
    constructor(private readonly rigsService: RigsService) { }

    @Get()
    @RequirePermission('rigs', 'canView')
    findAll(@Query('locationId') locationId?: string, @Query('customerId') customerId?: string) {
        return this.rigsService.findAll(locationId, customerId);
    }

    @Get(':id')
    @RequirePermission('rigs', 'canView')
    findOne(@Param('id') id: string) {
        return this.rigsService.findOne(id);
    }

    @Post()
    @RequirePermission('rigs', 'canAdd')
    create(@Body() createRigDto: CreateRigDto) {
        return this.rigsService.create(createRigDto);
    }

    @Patch(':id')
    @RequirePermission('rigs', 'canEdit')
    update(@Param('id') id: string, @Body() updateRigDto: UpdateRigDto) {
        return this.rigsService.update(id, updateRigDto);
    }

    @Delete(':id')
    @RequirePermission('rigs', 'canDelete')
    remove(@Param('id') id: string) {
        return this.rigsService.remove(id);
    }
}
