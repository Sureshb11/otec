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

    // Sub-category within TRS/DHT (e.g. CRT, Power Tong, HPU, Bucking)
    @Column({ nullable: true })
    category: string;

    // Manufacturer's serial number (separate from OTEC item code stored in serialNumber)
    @Column({ name: 'manufacturerSn', nullable: true })
    manufacturerSn: string;

    @Column({ name: 'partNo', nullable: true })
    partNo: string;

    @Column({ nullable: true })
    manufacturer: string;

    @Column({ nullable: true })
    country: string;

    @Column({ name: 'hsCode', nullable: true })
    hsCode: string;

    @Column({ name: 'cooNumber', nullable: true })
    cooNumber: string;

    @Column({ name: 'netWeight', type: 'decimal', precision: 10, scale: 3, nullable: true })
    netWeight: number;

    @Column({ name: 'receivedDate', type: 'date', nullable: true })
    receivedDate: Date;

    @Column({ name: 'invoiceNumber', nullable: true })
    invoiceNumber: string;

    @Column({ name: 'poNumber', nullable: true })
    poNumber: string;

    @Column({ nullable: true })
    uom: string;

    @Column({ type: 'boolean', default: false })
    catalogue: boolean;

    @Column({ name: 'nextMaintenanceDate', type: 'date', nullable: true })
    nextMaintenanceDate: Date;

    @Column({ name: 'maintenanceIntervalMonths', type: 'int', nullable: true, default: 6 })
    maintenanceIntervalMonths: number;

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
