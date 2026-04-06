import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Tool } from '../tools/tool.entity';
import { ToolInstance } from '../tool-instances/tool-instance.entity';
import { Order } from '../orders/order.entity';
import { Rig } from '../rigs/rig.entity';
import { Customer } from '../customers/customer.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Tool, ToolInstance, Order, Rig, Customer])],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [DashboardService],
})
export class DashboardModule { }
