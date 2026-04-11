import {
    IsString,
    IsOptional,
    IsEnum,
    IsUUID,
    IsBoolean,
    IsNumber,
    IsDateString,
} from 'class-validator';
import { ToolType, ToolStatus } from '../tool.entity';

export class CreateToolDto {
    @IsString()
    name: string;

    @IsEnum(ToolType)
    type: ToolType;

    @IsString()
    serialNumber: string;

    @IsOptional()
    @IsString()
    size?: string;

    @IsOptional()
    @IsEnum(ToolStatus)
    status?: ToolStatus;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID()
    rigId?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    manufacturerSn?: string;

    @IsOptional()
    @IsString()
    partNo?: string;

    @IsOptional()
    @IsString()
    manufacturer?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    hsCode?: string;

    @IsOptional()
    @IsString()
    cooNumber?: string;

    @IsOptional()
    @IsNumber()
    netWeight?: number;

    @IsOptional()
    @IsDateString()
    receivedDate?: string;

    @IsOptional()
    @IsString()
    invoiceNumber?: string;

    @IsOptional()
    @IsString()
    poNumber?: string;

    @IsOptional()
    @IsString()
    uom?: string;

    @IsOptional()
    @IsBoolean()
    catalogue?: boolean;

    @IsOptional()
    @IsDateString()
    nextMaintenanceDate?: string;

    @IsOptional()
    @IsNumber()
    maintenanceIntervalMonths?: number;
}

export class UpdateToolDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEnum(ToolType)
    type?: ToolType;

    @IsOptional()
    @IsString()
    serialNumber?: string;

    @IsOptional()
    @IsString()
    size?: string;

    @IsOptional()
    @IsEnum(ToolStatus)
    status?: ToolStatus;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID()
    rigId?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    manufacturerSn?: string;

    @IsOptional()
    @IsString()
    partNo?: string;

    @IsOptional()
    @IsString()
    manufacturer?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    hsCode?: string;

    @IsOptional()
    @IsString()
    cooNumber?: string;

    @IsOptional()
    @IsNumber()
    netWeight?: number;

    @IsOptional()
    @IsDateString()
    receivedDate?: string;

    @IsOptional()
    @IsString()
    invoiceNumber?: string;

    @IsOptional()
    @IsString()
    poNumber?: string;

    @IsOptional()
    @IsString()
    uom?: string;

    @IsOptional()
    @IsBoolean()
    catalogue?: boolean;

    @IsOptional()
    @IsDateString()
    nextMaintenanceDate?: string;

    @IsOptional()
    @IsNumber()
    maintenanceIntervalMonths?: number;
}
