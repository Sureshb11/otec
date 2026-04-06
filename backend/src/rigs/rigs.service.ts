import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rig } from './rig.entity';
import { CreateRigDto, UpdateRigDto } from './dto/rig.dto';

@Injectable()
export class RigsService {
    constructor(
        @InjectRepository(Rig)
        private rigsRepository: Repository<Rig>,
    ) { }

    async findAll(locationId?: string, customerId?: string): Promise<Rig[]> {
        const where: any = {};
        if (locationId) where.locationId = locationId;
        if (customerId) where.customerId = customerId;

        return this.rigsRepository.find({
            where,
            relations: ['location', 'customer'],
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Rig> {
        const rig = await this.rigsRepository.findOne({
            where: { id },
            relations: ['location', 'customer'],
        });
        if (!rig) {
            throw new NotFoundException(`Rig with ID ${id} not found`);
        }
        return rig;
    }

    async create(createRigDto: CreateRigDto): Promise<Rig> {
        const rig = this.rigsRepository.create(createRigDto);
        return this.rigsRepository.save(rig);
    }

    async update(id: string, updateRigDto: UpdateRigDto): Promise<Rig> {
        const rig = await this.findOne(id);
        Object.assign(rig, updateRigDto);
        return this.rigsRepository.save(rig);
    }

    async remove(id: string): Promise<void> {
        const rig = await this.findOne(id);
        await this.rigsRepository.remove(rig);
    }
}
