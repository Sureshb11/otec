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
import { LocationsService } from './locations.service';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';

@Controller('locations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LocationsController {
    constructor(private readonly locationsService: LocationsService) { }

    @Get()
    @RequirePermission('locations', 'canView')
    findAll(@Query('customerId') customerId?: string) {
        return this.locationsService.findAll(customerId);
    }

    @Get(':id')
    @RequirePermission('locations', 'canView')
    findOne(@Param('id') id: string) {
        return this.locationsService.findOne(id);
    }

    @Post()
    @RequirePermission('locations', 'canAdd')
    create(@Body() createLocationDto: CreateLocationDto) {
        return this.locationsService.create(createLocationDto);
    }

    @Patch(':id')
    @RequirePermission('locations', 'canEdit')
    update(@Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto) {
        return this.locationsService.update(id, updateLocationDto);
    }

    @Delete(':id')
    @RequirePermission('locations', 'canDelete')
    remove(@Param('id') id: string) {
        return this.locationsService.remove(id);
    }
}
