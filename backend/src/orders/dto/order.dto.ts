import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../order.entity';

export class CreateOrderItemDto {
    @IsUUID()
    toolId: string;

    @IsNumber()
    quantity: number;

    @IsOptional()
    @IsString()
    size?: string;

    @IsOptional()
    @IsNumber()
    duration?: number;

    @IsOptional()
    @IsNumber()
    dailyRate?: number;
}

export class CreateOrderDto {
    @IsString()
    orderNumber: string;

    @IsUUID()
    customerId: string;

    @IsOptional()
    @IsUUID()
    locationId?: string;

    @IsOptional()
    @IsUUID()
    rigId?: string;

    @IsDateString()
    startDate: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    @IsString()
    wellNumber?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsNumber()
    totalAmount?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items?: CreateOrderItemDto[];
}

export class UpdateOrderDto {
    @IsOptional()
    @IsString()
    orderNumber?: string;

    @IsOptional()
    @IsUUID()
    customerId?: string;

    @IsOptional()
    @IsUUID()
    locationId?: string;

    @IsOptional()
    @IsUUID()
    rigId?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsNumber()
    totalAmount?: number;

    @IsOptional()
    @IsString()
    wellNumber?: string;
}
