import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Tool } from '../tools/tool.entity';

@Entity('order_items')
export class OrderItem {
    @Column({ primary: true, type: 'uuid', default: () => 'gen_random_uuid()' })
    id: string;

    @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @Column({ name: 'orderId' })
    orderId: string;

    @ManyToOne(() => Tool)
    @JoinColumn({ name: 'toolId' })
    tool: Tool;

    @Column({ name: 'toolId' })
    toolId: string;

    @Column({ type: 'varchar', nullable: true })
    size: string;

    @Column({ type: 'int', default: 1 })
    quantity: number;

    @Column({ type: 'int', nullable: true })
    duration: number; // Days

    @Column({ name: 'dailyRate', type: 'decimal', precision: 10, scale: 2, nullable: true })
    dailyRate: number;

    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt' })
    updatedAt: Date;
}
