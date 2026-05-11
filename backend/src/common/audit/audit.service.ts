import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

export interface AuditEntry {
  action: string;
  resource: string;
  resourceId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.repo.insert({
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId ?? null,
        actorId: entry.actorId ?? null,
        actorEmail: entry.actorEmail ?? null,
        metadata: entry.metadata ?? null,
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${err instanceof Error ? err.message : err}`);
    }
  }
}
