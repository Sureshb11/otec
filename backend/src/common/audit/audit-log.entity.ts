import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  action: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  resource: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  resourceId: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 320, nullable: true })
  actorEmail: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;
}
