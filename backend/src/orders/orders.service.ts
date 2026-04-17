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

        // ─────────────────────────────────────────────────────────────────
        //  ORDER → TOOL STATUS FLOW
        //
        //  DRAFT      → (no tool change)
        //  BOOKED     → tools: AVAILABLE → IN_TRANSIT   (order placed, tools being prepared)
        //  ACTIVE     → tools: IN_TRANSIT → ONSITE      (tools at rig, job started, rig assigned)
        //  JOB_DONE   → tools: ONSITE → AVAILABLE       (job complete, tools back to yard)
        //  RETURNED   → tools: ensure AVAILABLE         (final confirmation, operational hours recorded)
        //  CANCELLED  → tools: back to AVAILABLE        (from any active state)
        // ─────────────────────────────────────────────────────────────────
        order.status = targetStatus;

        if (targetStatus === OrderStatus.BOOKED) {
            // Tools are "claimed" for this order — mark as IN-TRANSIT so they don't appear as available
            if (order.items) {
                for (const item of order.items) {
                    await this.toolsRepository.update(item.toolId, {
                        status: ToolStatus.IN_TRANSIT,
                    });
                }
            }
        }

        if (targetStatus === OrderStatus.ACTIVE) {
            order.activatedAt = new Date();
            // Tools arrive at rig — mark ONSITE and assign rig
            if (order.items) {
                for (const item of order.items) {
                    await this.toolsRepository.update(item.toolId, {
                        status: ToolStatus.ONSITE,
                        rigId: order.rigId,
                    });
                }
            }
        }

        if (targetStatus === OrderStatus.JOB_DONE) {
            // Job complete — release tools to yard, accumulate operational hours, clear rig
            if (order.items) {
                const activatedTime = order.activatedAt ? new Date(order.activatedAt) : null;
                const hoursWorked = activatedTime
                    ? (new Date().getTime() - activatedTime.getTime()) / (1000 * 60 * 60)
                    : 0;
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

        if (targetStatus === OrderStatus.RETURNED) {
            order.returnedAt = new Date();
            // Final confirmation — ensure tools are available (safety net if JOB_DONE was skipped)
            if (order.items) {
                for (const item of order.items) {
                    const tool = await this.toolsRepository.findOne({ where: { id: item.toolId } });
                    if (tool && tool.status !== ToolStatus.AVAILABLE) {
                        const activatedTime = order.activatedAt ? new Date(order.activatedAt) : null;
                        const hoursWorked = activatedTime
                            ? (new Date().getTime() - activatedTime.getTime()) / (1000 * 60 * 60)
                            : 0;
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
            // Release tools back to yard from any active state (IN_TRANSIT, ONSITE)
            if (order.items) {
                for (const item of order.items) {
                    const tool = await this.toolsRepository.findOne({ where: { id: item.toolId } });
                    if (tool && [ToolStatus.IN_TRANSIT, ToolStatus.ONSITE].includes(tool.status)) {
                        await this.toolsRepository.update(item.toolId, {
                            status: ToolStatus.AVAILABLE,
                            rigId: null,
                        });
                    }
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
