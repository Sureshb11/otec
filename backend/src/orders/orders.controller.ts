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
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Get()
    @RequirePermission('orders', 'canView')
    findAll() {
        return this.ordersService.findAll();
    }

    @Get(':id')
    @RequirePermission('orders', 'canView')
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Get(':id/items')
    @RequirePermission('orders', 'canView')
    getOrderItems(@Param('id') id: string) {
        return this.ordersService.getOrderItems(id);
    }

    @Post()
    @RequirePermission('orders', 'canAdd')
    create(@Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(createOrderDto);
    }

    @Patch(':id')
    @RequirePermission('orders', 'canEdit')
    update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
        return this.ordersService.update(id, updateOrderDto);
    }

    @Patch(':id/status')
    @RequirePermission('orders', 'canEdit')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.ordersService.updateStatus(id, status);
    }

    @Delete(':id')
    @RequirePermission('orders', 'canDelete')
    remove(@Param('id') id: string) {
        return this.ordersService.remove(id);
    }
}
