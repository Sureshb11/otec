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
import { InventoryService } from './inventory.service';
import { CreateInventoryDto, UpdateInventoryDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get()
    @RequirePermission('inventory', 'canView')
    findAll() {
        return this.inventoryService.findAll();
    }

    @Get('low-stock')
    @RequirePermission('inventory', 'canView')
    findLowStock() {
        return this.inventoryService.findLowStock();
    }

    @Get(':id')
    @RequirePermission('inventory', 'canView')
    findOne(@Param('id') id: string) {
        return this.inventoryService.findOne(id);
    }

    @Post()
    @RequirePermission('inventory', 'canAdd')
    create(@Body() createInventoryDto: CreateInventoryDto) {
        return this.inventoryService.create(createInventoryDto);
    }

    @Patch(':id')
    @RequirePermission('inventory', 'canEdit')
    update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
        return this.inventoryService.update(id, updateInventoryDto);
    }

    @Delete(':id')
    @RequirePermission('inventory', 'canDelete')
    remove(@Param('id') id: string) {
        return this.inventoryService.remove(id);
    }
}
