import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tool, ToolStatus } from '../tools/tool.entity';
import { ToolInstance, ToolInstanceStatus } from '../tool-instances/tool-instance.entity';
import { Order, OrderStatus } from '../orders/order.entity';
import { Rig } from '../rigs/rig.entity';
import { Customer } from '../customers/customer.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Tool)
        private toolsRepository: Repository<Tool>,
        @InjectRepository(ToolInstance)
        private toolInstancesRepository: Repository<ToolInstance>,
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @InjectRepository(Rig)
        private rigsRepository: Repository<Rig>,
        @InjectRepository(Customer)
        private customersRepository: Repository<Customer>,
    ) { }

    async getSummary() {
        const [activeTools, totalTools] = await Promise.all([
            this.toolsRepository.count({ where: { status: ToolStatus.ONSITE } }),
            this.toolsRepository.count(),
        ]);

        const [activeRigs, totalRigs] = await Promise.all([
            this.rigsRepository.count({ where: { status: 'active' as any } }),
            this.rigsRepository.count(),
        ]);

        const availableTools = await this.toolsRepository.count({ where: { status: ToolStatus.AVAILABLE } });
        const maintenanceTools = await this.toolsRepository.count({ where: { status: ToolStatus.MAINTENANCE } });

        const activeOrders = await this.ordersRepository.count({ where: { status: OrderStatus.ACTIVE } });
        const totalCustomers = await this.customersRepository.count();

        return {
            tools: { active: activeTools, available: availableTools, maintenance: maintenanceTools, total: totalTools },
            rigs: { active: activeRigs, total: totalRigs },
            orders: { active: activeOrders },
            customers: { total: totalCustomers },
        };
    }

    async getActiveTools(customerId?: string, rigId?: string, status?: string) {
        const query = this.toolsRepository
            .createQueryBuilder('tool')
            .leftJoinAndSelect('tool.rig', 'rig')
            .leftJoinAndSelect('rig.location', 'location')
            .leftJoinAndSelect('rig.customer', 'customer');

        if (status) {
            query.where('tool.status = :status', { status });
        } else {
            query.where('tool.status = :status', { status: ToolStatus.ONSITE });
        }

        if (customerId) {
            query.andWhere('rig.customerId = :customerId', { customerId });
        }

        if (rigId) {
            query.andWhere('tool.rigId = :rigId', { rigId });
        }

        const tools = await query.orderBy('tool.type', 'ASC').addOrderBy('tool.name', 'ASC').getMany();

        return tools;
    }

    async getActiveToolInstances(toolId?: string) {
        const query = this.toolInstancesRepository
            .createQueryBuilder('instance')
            .leftJoinAndSelect('instance.tool', 'tool')
            .leftJoinAndSelect('instance.rig', 'rig')
            .leftJoinAndSelect('rig.location', 'location')
            .leftJoinAndSelect('rig.customer', 'customer')
            .where('instance.status = :status', { status: ToolInstanceStatus.RUNNING });

        if (toolId) {
            query.andWhere('instance.toolId = :toolId', { toolId });
        }

        const instances = await query.orderBy('instance.startTime', 'ASC').getMany();

        // Calculate real-time running hours
        const now = new Date();
        return instances.map((instance) => ({
            ...instance,
            calculatedRunningHours: instance.startTime
                ? (now.getTime() - new Date(instance.startTime).getTime()) / (1000 * 60 * 60)
                : instance.runningHours,
        }));
    }
}
