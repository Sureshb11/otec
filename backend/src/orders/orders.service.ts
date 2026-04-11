import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, ORDER_TRANSITIONS } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Tool, ToolStatus } from '../tools/tool.entity';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemsRepository: Repository<OrderItem>,
        @InjectRepository(Tool)
        private toolsRepository: Repository<Tool>,
    ) { }

    async findAll(): Promise<Order[]> {
        return this.ordersRepository.find({
            relations: ['customer', 'location', 'rig', 'items', 'items.tool'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Order> {
        const order = await this.ordersRepository.findOne({
            where: { id },
            relations: ['customer', 'location', 'rig', 'items', 'items.tool'],
        });
        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }
        return order;
    }

    async create(createOrderDto: CreateOrderDto): Promise<Order> {
        const { items, ...orderData } = createOrderDto;
        const order = this.ordersRepository.create({
            ...orderData,
            status: orderData.status || OrderStatus.BOOKED,
        });
        const savedOrder = await this.ordersRepository.save(order);

        if (items && items.length > 0) {
            const orderItems = items.map((item) =>
                this.orderItemsRepository.create({
                    ...item,
                    orderId: savedOrder.id,
                }),
            );
            await this.orderItemsRepository.save(orderItems);
        }

        return this.findOne(savedOrder.id);
    }

    async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
        const order = await this.findOne(id);

        // Only allow editing of draft/booked orders
        if (order.status !== OrderStatus.DRAFT && order.status !== OrderStatus.BOOKED) {
            throw new BadRequestException(
                `Cannot edit an order in '${order.status}' status. Only Draft and Booked orders can be edited.`,
            );
        }

        Object.assign(order, updateOrderDto);
        return this.ordersRepository.save(order);
    }

    /**
     * State-machine driven status transition.
     * Validates that the transition is allowed before applying it.
     */
    async updateStatus(id: string, newStatus: string): Promise<Order> {
        const order = await this.findOne(id);
        const currentStatus = order.status;
        const targetStatus = newStatus as OrderStatus;

        // Validate the enum value
        if (!Object.values(OrderStatus).includes(targetStatus)) {
            throw new BadRequestException(
                `Invalid status '${newStatus}'. Valid statuses: ${Object.values(OrderStatus).join(', ')}`,
            );
        }

        // Validate the transition
        const allowedTransitions = ORDER_TRANSITIONS[currentStatus];
        if (!allowedTransitions || !allowedTransitions.includes(targetStatus)) {
            throw new BadRequestException(
                `Invalid transition from '${currentStatus}' to '${targetStatus}'. Allowed transitions: ${allowedTransitions?.join(', ') || 'none'}`,
            );
        }

        // Apply side-effects based on transition
        order.status = targetStatus;

        if (targetStatus === OrderStatus.ACTIVE) {
            order.activatedAt = new Date();
            // Mark all tools in this order as onsite and assign them to the order's rig
            if (order.items) {
                for (const item of order.items) {
                    await this.toolsRepository.update(item.toolId, {
                        status: ToolStatus.ONSITE,
                        rigId: order.rigId
                    });
                }
            }
        }

        if (targetStatus === OrderStatus.RETURNED) {
            order.returnedAt = new Date();
            // Mark all tools in this order as available, update operational hours, and release from rig
            if (order.items && order.activatedAt) {
                const hoursWorked = (new Date().getTime() - order.activatedAt.getTime()) / (1000 * 60 * 60);
                for (const item of order.items) {
                    const tool = await this.toolsRepository.findOne({ where: { id: item.toolId } });
                    if (tool) {
                        await this.toolsRepository.update(item.toolId, {
                            status: ToolStatus.AVAILABLE,
                            rigId: null,
                            operationalHours: Number(tool.operationalHours || 0) + hoursWorked,
                        });
                    }
                }
            }
        }

        if (targetStatus === OrderStatus.CANCELLED) {
            // Release any tools that were marked onsite and release from rig
            if (order.items && (currentStatus === OrderStatus.ACTIVE)) {
                for (const item of order.items) {
                    await this.toolsRepository.update(item.toolId, {
                        status: ToolStatus.AVAILABLE,
                        rigId: null
                    });
                }
            }
        }

        return this.ordersRepository.save(order);
    }

    async remove(id: string): Promise<void> {
        const order = await this.findOne(id);
        if (order.status !== OrderStatus.DRAFT && order.status !== OrderStatus.CANCELLED) {
            throw new BadRequestException(
                `Cannot delete an order in '${order.status}' status. Only Draft or Cancelled orders can be deleted.`,
            );
        }
        await this.ordersRepository.remove(order);
    }

    async getOrderItems(orderId: string): Promise<OrderItem[]> {
        return this.orderItemsRepository.find({
            where: { orderId },
            relations: ['tool'],
        });
    }
}
