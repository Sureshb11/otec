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
    ) { }

    async findAll(): Promise<Tool[]> {
        return this.toolsRepository.find({
            relations: ['rig', 'rig.location', 'rig.customer'],
            order: { name: 'ASC' },
        });
    }

    async findAvailable(): Promise<Tool[]> {
        return this.toolsRepository.find({
            where: { status: ToolStatus.AVAILABLE },
            relations: ['rig', 'rig.location', 'rig.customer'],
            order: { name: 'ASC' },
        });
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
                'Cannot delete a tool that is currently onsite. Return the tool to yard first via the Orders workflow.'
            );
        }
        if (tool.status === ToolStatus.MAINTENANCE) {
            throw new BadRequestException(
                'Cannot delete a tool that is currently in maintenance/service. Complete or cancel the maintenance first.'
            );
        }
        try {
            await this.toolsRepository.remove(tool);
        } catch (err: any) {
            if (err?.code === '23503') {
                throw new BadRequestException(
                    'Cannot delete this tool because it is referenced in existing orders. Remove it from all orders first.'
                );
            }
            throw err;
        }
    }
}
