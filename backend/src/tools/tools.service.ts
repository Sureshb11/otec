import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tool, ToolStatus } from './tool.entity';
import { CreateToolDto, UpdateToolDto } from './dto/tool.dto';

@Injectable()
export class ToolsService {
  constructor(
    @InjectRepository(Tool)
    private toolsRepository: Repository<Tool>,
  ) {}

  async findAll(): Promise<any[]> {
    const tools = await this.toolsRepository.find({
      relations: ['rig', 'rig.location', 'rig.customer'],
      order: { name: 'ASC' },
    });
    return this.attachDeployedSize(tools);
  }

  async findAvailable(): Promise<Tool[]> {
    return this.toolsRepository.find({
      where: { status: ToolStatus.AVAILABLE },
      relations: ['rig', 'rig.location', 'rig.customer'],
      order: { name: 'ASC' },
    });
  }

  // For tools currently on an active order, expose the size that was
  // selected on the order_items row. Without this the UI falls back to
  // tools.size which is the full compatibility list from the master sheet.
  private async attachDeployedSize(tools: Tool[]): Promise<any[]> {
    const activeIds = tools
      .filter((t) => t.status === ToolStatus.IN_TRANSIT || t.status === ToolStatus.ONSITE)
      .map((t) => t.id);
    if (activeIds.length === 0) return tools as any[];

    const rows: { toolId: string; size: string | null }[] =
      await this.toolsRepository.manager.query(
        `SELECT oi."toolId" AS "toolId", oi.size AS size
                 FROM order_items oi
                 JOIN orders o ON o.id = oi."orderId"
                 WHERE oi."toolId" = ANY($1)
                   AND o.status IN ('booked', 'active', 'job_done')`,
        [activeIds],
      );

    const sizeByToolId = new Map<string, string | null>();
    for (const r of rows) sizeByToolId.set(r.toolId, r.size);
    return tools.map((t) => ({
      ...t,
      deployedSize: sizeByToolId.get(t.id) ?? null,
    }));
  }

  async findOne(id: string): Promise<Tool> {
    const tool = await this.toolsRepository.findOne({
      where: { id },
      relations: ['rig', 'rig.location', 'rig.customer'],
    });
    if (!tool) {
      throw new NotFoundException(`Tool with ID ${id} not found`);
    }
    return tool;
  }

  async create(createToolDto: CreateToolDto): Promise<Tool> {
    const tool = this.toolsRepository.create(createToolDto);
    return this.toolsRepository.save(tool);
  }

  async update(id: string, updateToolDto: UpdateToolDto): Promise<Tool> {
    const tool = await this.findOne(id);
    Object.assign(tool, updateToolDto);
    return this.toolsRepository.save(tool);
  }

  async remove(id: string): Promise<void> {
    const tool = await this.findOne(id);
    if (tool.status === ToolStatus.ONSITE) {
      throw new BadRequestException(
        'Cannot delete a tool that is currently onsite. Return the tool to yard first via the Orders workflow.',
      );
    }
    if (tool.status === ToolStatus.MAINTENANCE) {
      throw new BadRequestException(
        'Cannot delete a tool that is currently in maintenance/service. Complete or cancel the maintenance first.',
      );
    }
    try {
      await this.toolsRepository.remove(tool);
    } catch (err: any) {
      if (err?.code === '23503') {
        throw new BadRequestException(
          'Cannot delete this tool because it is referenced in existing orders. Remove it from all orders first.',
        );
      }
      throw err;
    }
  }
}
