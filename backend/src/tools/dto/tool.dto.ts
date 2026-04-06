import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
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
}
