import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Location } from '../locations/location.entity';
import { Rig } from '../rigs/rig.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
    DRAFT = 'draft',
    BOOKED = 'booked',
    ACTIVE = 'active',
    JOB_DONE = 'job_done',
    RETURNED = 'returned',
    CANCELLED = 'cancelled',
}

// Defines valid state transitions for the order lifecycle
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.BOOKED, OrderStatus.ACTIVE, OrderStatus.CANCELLED],
    [OrderStatus.BOOKED]: [OrderStatus.ACTIVE, OrderStatus.CANCELLED],
    [OrderStatus.ACTIVE]: [OrderStatus.JOB_DONE],
    [OrderStatus.JOB_DONE]: [OrderStatus.RETURNED],
    [OrderStatus.RETURNED]: [],
    [OrderStatus.CANCELLED]: [],
};

@Entity('orders')
export class Order {
    @Column({ primary: true, type: 'uuid', default: () => 'gen_random_uuid()' })
    id: string;

    @Column({ name: 'orderNumber', unique: true })
    orderNumber: string;

    @ManyToOne(() => Customer, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'customerId' })
    customer: Customer;

    @Column({ name: 'customerId' })
    customerId: string;

    @ManyToOne(() => Location, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'locationId' })
    location: Location;

    @Column({ name: 'locationId', nullable: true })
    locationId: string;

    @ManyToOne(() => Rig, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'rigId' })
    rig: Rig;

    @Column({ name: 'rigId', nullable: true })
    rigId: string;

    @Column({ type: 'varchar', default: OrderStatus.DRAFT })
    status: OrderStatus;

    @Column({ name: 'startDate', type: 'date' })
    startDate: Date;

    @Column({ name: 'endDate', type: 'date', nullable: true })
    endDate: Date;

    @Column({ name: 'activatedAt', type: 'timestamp', nullable: true })
    activatedAt: Date;

    @Column({ name: 'returnedAt', type: 'timestamp', nullable: true })
    returnedAt: Date;

    @Column({ name: 'totalAmount', type: 'decimal', precision: 12, scale: 2, nullable: true })
    totalAmount: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];

    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt' })
    updatedAt: Date;
}
