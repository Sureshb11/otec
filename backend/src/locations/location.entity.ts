import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Customer } from '../customers/customer.entity';

@Entity('locations')
export class Location {
    @Column({ primary: true, type: 'uuid', default: () => 'gen_random_uuid()' })
    id: string;

    @Column()
    name: string;

    @Column()
    country: string;

    @Column({ nullable: true })
    region: string;

    @Column({ nullable: true })
    coordinates: string;

    @Column({ nullable: true })
    description: string;

    @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'customerId' })
    customer: Customer;

    @Column({ name: 'customerId', nullable: true })
    customerId: string;

    @Column({ name: 'isActive', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt' })
    updatedAt: Date;
}
