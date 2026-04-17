import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Location } from '../locations/location.entity';
import { Customer } from '../customers/customer.entity';

export enum RigStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    MAINTENANCE = 'maintenance',
}

export enum RigType {
    TRS = 'TRS',
    DHT = 'DHT',
}

@Entity('rigs')
export class Rig {
    @Column({ primary: true, type: 'uuid', default: () => 'gen_random_uuid()' })
    id: string;

    @Column()
    name: string;

    @Column({ type: 'enum', enum: RigType })
    type: RigType;

    @Column({ type: 'enum', enum: RigStatus, default: RigStatus.ACTIVE })
    status: RigStatus;

    @Column({ nullable: true })
    description: string;

    @Column({ name: 'wellNumber', nullable: true })
    wellNumber: string;

    @ManyToOne(() => Location, { nullable: true })
    @JoinColumn({ name: 'locationId' })
    location: Location;

    @Column({ name: 'locationId', nullable: true })
    locationId: string;

    @ManyToOne(() => Customer, { nullable: true })
    @JoinColumn({ name: 'customerId' })
    customer: Customer;

    @Column({ name: 'customerId', nullable: true })
    customerId: string;

    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt' })
    updatedAt: Date;
}
