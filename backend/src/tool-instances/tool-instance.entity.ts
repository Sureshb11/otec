import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Tool } from '../tools/tool.entity';
import { Rig } from '../rigs/rig.entity';

export enum ToolInstanceStatus {
    RUNNING = 'running',
    STOPPED = 'stopped',
    COMPLETED = 'completed',
}

@Entity('tool_instances')
export class ToolInstance {
    @Column({ primary: true, type: 'uuid', default: () => 'gen_random_uuid()' })
    id: string;

    @ManyToOne(() => Tool)
    @JoinColumn({ name: 'toolId' })
    tool: Tool;

    @Column({ name: 'toolId' })
    toolId: string;

    @ManyToOne(() => Rig)
    @JoinColumn({ name: 'rigId' })
    rig: Rig;

    @Column({ name: 'rigId' })
    rigId: string;

    @Column({ name: 'startTime', type: 'timestamp' })
    startTime: Date;

    @Column({ name: 'endTime', type: 'timestamp', nullable: true })
    endTime: Date;

    @Column({ name: 'runningHours', type: 'decimal', precision: 10, scale: 2, default: 0 })
    runningHours: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    depth: number;

    @Column({ type: 'enum', enum: ToolInstanceStatus, default: ToolInstanceStatus.RUNNING })
    status: ToolInstanceStatus;

    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt' })
    updatedAt: Date;
}
