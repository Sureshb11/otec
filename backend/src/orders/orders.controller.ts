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

    /**
     * Start an operational runtime segment for this order — called when the
     * operator clicks "Start Operation" in the Kanban (Standby → Active).
     * Stamps `operationStartedAt` so the Dashboard timer counts from here.
     */
    @Patch(':id/operation/start')
    @RequirePermission('orders', 'canEdit')
    startOperation(@Param('id') id: string) {
        return this.ordersService.startOperation(id);
    }

    /**
     * Stop the current operational runtime segment — called on "Stop" in the Kanban.
     * Accumulates elapsed seconds into `totalOperationalSeconds` and clears
     * `operationStartedAt`. Next Start resumes accumulation.
     */
    @Patch(':id/operation/stop')
    @RequirePermission('orders', 'canEdit')
    stopOperation(@Param('id') id: string) {
        return this.ordersService.stopOperation(id);
    }

    /**
     * Reconcile tool.status / tool.rigId against current open orders.
     * Useful when Kanban column and Tools page disagree (e.g. a stuck
     * ONSITE tool whose order was manually closed long ago).
     */
    @Post('reconcile-tools')
    @RequirePermission('orders', 'canEdit')
    reconcileTools() {
        return this.ordersService.reconcileToolStatuses();
    }

    @Delete(':id')
    @RequirePermission('orders', 'canDelete')
    remove(@Param('id') id: string) {
        return this.ordersService.remove(id);
    }
}
