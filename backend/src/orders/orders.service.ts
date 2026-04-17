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
        const initialStatus = orderData.status || OrderStatus.BOOKED;
        const order = this.ordersRepository.create({
            ...orderData,
            status: initialStatus,
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

            // Sync tool statuses to match the order's initial status. Mirrors
            // the logic in updateStatus() — without this, a freshly-booked
            // order leaves each tool in whatever status it inherited from a
            // previous order (e.g. ONSITE from a job that never closed cleanly),
            // so the Tools page and the Kanban disagree.
            if (initialStatus === OrderStatus.BOOKED) {
                for (const item of items) {
                    await this.toolsRepository.update(item.toolId, {
                        status: ToolStatus.IN_TRANSIT,
                    });
                }
            } else if (initialStatus === OrderStatus.ACTIVE) {
                for (const item of items) {
                    await this.toolsRepository.update(item.toolId, {
                        status: ToolStatus.ONSITE,
                        rigId: savedOrder.rigId,
                    });
                }
            }
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
            // Dispatch stage: tools are en route to the rig, not there yet.
            // They flip to ONSITE later, when the rig crew confirms arrival
            // via markReachedOnsite().
            if (order.items) {
                for (const item of order.items) {
                    await this.toolsRepository.update(item.toolId, {
                        status: ToolStatus.IN_TRANSIT,
                        rigId: null,
                    });
                }
            }
        }

        if (targetStatus === OrderStatus.JOB_DONE) {
            // Close any open operation segment first so runtime is complete
            this.closeOpenOperationSegment(order);
            // Job complete — release tools to yard, distribute accumulated runtime hours, clear rig
            if (order.items) {
                const hoursWorked = (order.totalOperationalSeconds || 0) / 3600;
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
            // Safety net: close any still-open segment if JOB_DONE was skipped
            this.closeOpenOperationSegment(order);
            // Final confirmation — ensure tools are available (safety net if JOB_DONE was skipped)
            if (order.items) {
                const hoursWorked = (order.totalOperationalSeconds || 0) / 3600;
                for (const item of order.items) {
                    const tool = await this.toolsRepository.findOne({ where: { id: item.toolId } });
                    if (tool && tool.status !== ToolStatus.AVAILABLE) {
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
            // Close any open segment so the cancel reflects real runtime up to this moment
            this.closeOpenOperationSegment(order);
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

    /**
     * Mark that the dispatched tools have physically arrived at the rig.
     * Flips each tool from IN_TRANSIT → ONSITE and assigns the rig.
     * Called when the rig crew confirms arrival (Kanban: In-Transit → Onsite).
     *
     * Idempotent: re-calling is a no-op beyond updating the timestamp.
     * Requires order.status === 'active'.
     */
    async markReachedOnsite(id: string): Promise<Order> {
        const order = await this.findOne(id);

        if (order.status !== OrderStatus.ACTIVE) {
            throw new BadRequestException(
                `Cannot mark reached-onsite on an order in '${order.status}' status. Order must be Active (dispatched).`,
            );
        }

        order.reachedOnsiteAt = new Date();

        if (order.items) {
            for (const item of order.items) {
                await this.toolsRepository.update(item.toolId, {
                    status: ToolStatus.ONSITE,
                    rigId: order.rigId,
                });
            }
        }

        return this.ordersRepository.save(order);
    }

    /**
     * Mark the order's tools as actively operating. Stamps operationStartedAt.
     * Called when the operator clicks "Start Operation" (Standby → Active).
     *
     * No-op if already running. Requires order.status === 'active'.
     */
    async startOperation(id: string): Promise<Order> {
        const order = await this.findOne(id);

        if (order.status !== OrderStatus.ACTIVE) {
            throw new BadRequestException(
                `Cannot start operation on an order in '${order.status}' status. Order must be Active (tools onsite).`,
            );
        }

        // Idempotent: if already running, just return current state
        if (order.operationStartedAt) {
            return order;
        }

        order.operationStartedAt = new Date();
        return this.ordersRepository.save(order);
    }

    /**
     * End the current operation segment. Adds elapsed seconds to totalOperationalSeconds
     * and clears operationStartedAt. Called on "Stop" button in the Kanban.
     *
     * Idempotent: no-op if no segment is open.
     */
    async stopOperation(id: string): Promise<Order> {
        const order = await this.findOne(id);

        if (!order.operationStartedAt) {
            return order; // nothing running, no-op
        }

        this.closeOpenOperationSegment(order);
        return this.ordersRepository.save(order);
    }

    /**
     * Helper: if the order has an open operation segment, accumulate the elapsed
     * seconds into totalOperationalSeconds and clear operationStartedAt.
     * Mutates `order` in place. Caller is responsible for persisting.
     */
    private closeOpenOperationSegment(order: Order): void {
        if (!order.operationStartedAt) return;
        const startedAt = new Date(order.operationStartedAt).getTime();
        const elapsedSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
        order.totalOperationalSeconds = Number(order.totalOperationalSeconds || 0) + elapsedSec;
        order.operationStartedAt = null;
    }

    /**
     * Reconcile tool statuses against their current order status.
     * Fixes data drift — e.g. a tool left as ONSITE after its order was
     * manually closed, or stuck IN_TRANSIT with no open order.
     *
     * Rules:
     *   - A tool referenced by an ACTIVE order  → must be ONSITE (+ rig assigned)
     *   - A tool referenced by a BOOKED order   → must be IN_TRANSIT
     *   - A tool with no open order             → must be AVAILABLE, no rig
     * Tools in MAINTENANCE are left alone — that's an operator-controlled state.
     */
    async reconcileToolStatuses(): Promise<{ fixed: number; details: string[] }> {
        const openOrders = await this.ordersRepository.find({
            where: [
                { status: OrderStatus.BOOKED },
                { status: OrderStatus.ACTIVE },
            ],
            relations: ['items'],
        });

        // Build expected state per tool from open orders.
        // ACTIVE has two sub-stages distinguished by reachedOnsiteAt:
        //   - null → tool is IN_TRANSIT (dispatched, not yet arrived)
        //   - set  → tool is ONSITE (rig crew confirmed arrival)
        const expected: Record<string, { status: ToolStatus; rigId: string | null }> = {};
        for (const order of openOrders) {
            if (!order.items) continue;
            for (const item of order.items) {
                if (order.status === OrderStatus.ACTIVE) {
                    if (order.reachedOnsiteAt) {
                        expected[item.toolId] = { status: ToolStatus.ONSITE, rigId: order.rigId };
                    } else {
                        // In-transit trumps any BOOKED claim already assigned
                        expected[item.toolId] = { status: ToolStatus.IN_TRANSIT, rigId: null };
                    }
                } else if (order.status === OrderStatus.BOOKED && !expected[item.toolId]) {
                    expected[item.toolId] = { status: ToolStatus.IN_TRANSIT, rigId: null };
                }
            }
        }

        const allTools = await this.toolsRepository.find();
        const details: string[] = [];
        let fixed = 0;

        for (const tool of allTools) {
            if (tool.status === ToolStatus.MAINTENANCE) continue;

            const target = expected[tool.id] ?? { status: ToolStatus.AVAILABLE, rigId: null };
            const needsStatusFix = tool.status !== target.status;
            const needsRigFix = (tool.rigId ?? null) !== (target.rigId ?? null);

            if (needsStatusFix || needsRigFix) {
                await this.toolsRepository.update(tool.id, {
                    status: target.status,
                    rigId: target.rigId,
                });
                fixed++;
                details.push(
                    `${tool.name} (${tool.serialNumber}): ${tool.status} → ${target.status}`,
                );
            }
        }

        return { fixed, details };
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
