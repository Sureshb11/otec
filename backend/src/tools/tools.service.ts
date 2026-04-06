import { Injectable, NotFoundException } from '@nestjs/common';
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
        await this.toolsRepository.remove(tool);
    }
}
