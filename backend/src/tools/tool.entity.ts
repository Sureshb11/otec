import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Rig } from '../rigs/rig.entity';

export enum ToolType {
    TRS = 'TRS',
    DHT = 'DHT',
}

export enum ToolStatus {
    AVAILABLE = 'available',
    ONSITE = 'onsite',
    MAINTENANCE = 'maintenance',
}

@Entity('tools')
export class Tool {
    @Column({ primary: true, type: 'uuid', default: () => 'gen_random_uuid()' })
    id: string;

    @Column()
    name: string;

    @Column({ type: 'enum', enum: ToolType })
    type: ToolType;

    @Column({ name: 'serialNumber', unique: true })
    serialNumber: string;

    @Column({ nullable: true })
    size: string;

    @Column({ type: 'enum', enum: ToolStatus, default: ToolStatus.AVAILABLE })
    status: ToolStatus;

    @Column({ nullable: true })
    description: string;

    @Column({ name: 'operationalHours', type: 'decimal', precision: 10, scale: 2, default: 0 })
    operationalHours: number;

    @ManyToOne(() => Rig, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'rigId' })
    rig: Rig;

    @Column({ name: 'rigId', nullable: true })
    rigId: string;

    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt' })
    updatedAt: Date;
}
