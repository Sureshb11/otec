import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ToolInstance, ToolInstanceStatus } from './tool-instance.entity';
import { CreateToolInstanceDto, UpdateToolInstanceDto } from './dto/tool-instance.dto';

@Injectable()
export class ToolInstancesService {
    constructor(
        @InjectRepository(ToolInstance)
        private toolInstancesRepository: Repository<ToolInstance>,
    ) { }

    async findAll(): Promise<ToolInstance[]> {
        return this.toolInstancesRepository.find({
            relations: ['tool', 'rig', 'rig.location'],
            order: { startTime: 'DESC' },
        });
    }

    async findActive(): Promise<ToolInstance[]> {
        return this.toolInstancesRepository.find({
            where: { status: ToolInstanceStatus.RUNNING },
            relations: ['tool', 'rig', 'rig.location'],
            order: { startTime: 'DESC' },
        });
    }

    async findOne(id: string): Promise<ToolInstance> {
        const instance = await this.toolInstancesRepository.findOne({
            where: { id },
            relations: ['tool', 'rig', 'rig.location'],
        });
        if (!instance) {
            throw new NotFoundException(`Tool instance with ID ${id} not found`);
        }
        return instance;
    }

    async create(createDto: CreateToolInstanceDto): Promise<ToolInstance> {
        const instance = this.toolInstancesRepository.create(createDto);
        return this.toolInstancesRepository.save(instance);
    }

    async update(id: string, updateDto: UpdateToolInstanceDto): Promise<ToolInstance> {
        const instance = await this.findOne(id);
        Object.assign(instance, updateDto);
        return this.toolInstancesRepository.save(instance);
    }

    async stop(id: string): Promise<ToolInstance> {
        const instance = await this.findOne(id);
        instance.endTime = new Date();
        instance.status = ToolInstanceStatus.COMPLETED;
        return this.toolInstancesRepository.save(instance);
    }
}
