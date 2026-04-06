import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Inventory } from './inventory.entity';
import { CreateInventoryDto, UpdateInventoryDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(Inventory)
        private inventoryRepository: Repository<Inventory>,
    ) { }

    async findAll(): Promise<Inventory[]> {
        return this.inventoryRepository.find({
            order: { itemName: 'ASC' },
        });
    }

    async findLowStock(): Promise<Inventory[]> {
        return this.inventoryRepository
            .createQueryBuilder('inventory')
            .where('inventory.quantity <= inventory.minStock')
            .orderBy('inventory.itemName', 'ASC')
            .getMany();
    }

    async findOne(id: string): Promise<Inventory> {
        const item = await this.inventoryRepository.findOne({ where: { id } });
        if (!item) {
            throw new NotFoundException(`Inventory item with ID ${id} not found`);
        }
        return item;
    }

    async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
        const item = this.inventoryRepository.create(createInventoryDto);
        return this.inventoryRepository.save(item);
    }

    async update(id: string, updateInventoryDto: UpdateInventoryDto): Promise<Inventory> {
        const item = await this.findOne(id);
        Object.assign(item, updateInventoryDto);
        return this.inventoryRepository.save(item);
    }

    async remove(id: string): Promise<void> {
        const item = await this.findOne(id);
        await this.inventoryRepository.remove(item);
    }
}
