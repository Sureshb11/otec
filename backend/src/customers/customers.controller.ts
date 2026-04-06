import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Get()
    @RequirePermission('customers', 'canView')
    findAll() {
        return this.customersService.findAll();
    }

    @Get(':id')
    @RequirePermission('customers', 'canView')
    findOne(@Param('id') id: string) {
        return this.customersService.findOne(id);
    }

    @Post()
    @RequirePermission('customers', 'canAdd')
    create(@Body() createCustomerDto: CreateCustomerDto) {
        return this.customersService.create(createCustomerDto);
    }

    @Patch(':id')
    @RequirePermission('customers', 'canEdit')
    update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
        return this.customersService.update(id, updateCustomerDto);
    }

    @Delete(':id')
    @RequirePermission('customers', 'canDelete')
    remove(@Param('id') id: string) {
        return this.customersService.remove(id);
    }
}
