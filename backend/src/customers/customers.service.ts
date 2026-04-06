import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer)
        private customersRepository: Repository<Customer>,
    ) { }

    async findAll(): Promise<Customer[]> {
        return this.customersRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Customer> {
        const customer = await this.customersRepository.findOne({ where: { id } });
        if (!customer) {
            throw new NotFoundException(`Customer with ID ${id} not found`);
        }
        return customer;
    }

    async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
        const customer = this.customersRepository.create(createCustomerDto);
        return this.customersRepository.save(customer);
    }

    async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
        const customer = await this.findOne(id);
        Object.assign(customer, updateCustomerDto);
        return this.customersRepository.save(customer);
    }

    async remove(id: string): Promise<void> {
        const customer = await this.findOne(id);
        await this.customersRepository.remove(customer);
    }
}
