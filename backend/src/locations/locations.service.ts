import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './location.entity';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';

@Injectable()
export class LocationsService {
    constructor(
        @InjectRepository(Location)
        private locationsRepository: Repository<Location>,
    ) { }

    async findAll(customerId?: string): Promise<Location[]> {
        const where: any = {};
        if (customerId) {
            where.customerId = customerId;
        }
        return this.locationsRepository.find({
            where,
            relations: ['customer'],
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Location> {
        const location = await this.locationsRepository.findOne({
            where: { id },
            relations: ['customer'],
        });
        if (!location) {
            throw new NotFoundException(`Location with ID ${id} not found`);
        }
        return location;
    }

    async create(createLocationDto: CreateLocationDto): Promise<Location> {
        const location = this.locationsRepository.create(createLocationDto);
        return this.locationsRepository.save(location);
    }

    async update(id: string, updateLocationDto: UpdateLocationDto): Promise<Location> {
        const location = await this.findOne(id);
        Object.assign(location, updateLocationDto);
        return this.locationsRepository.save(location);
    }

    async remove(id: string): Promise<void> {
        const location = await this.findOne(id);
        await this.locationsRepository.remove(location);
    }
}
