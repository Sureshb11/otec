import { IsUUID, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ToolInstanceStatus } from '../tool-instance.entity';

export class CreateToolInstanceDto {
    @IsUUID()
    toolId: string;

    @IsUUID()
    rigId: string;

    @IsDateString()
    startTime: string;

    @IsOptional()
    @IsDateString()
    endTime?: string;

    @IsOptional()
    @IsNumber()
    runningHours?: number;

    @IsOptional()
    @IsNumber()
    depth?: number;

    @IsOptional()
    @IsEnum(ToolInstanceStatus)
    status?: ToolInstanceStatus;
}

export class UpdateToolInstanceDto {
    @IsOptional()
    @IsDateString()
    endTime?: string;

    @IsOptional()
    @IsNumber()
    runningHours?: number;

    @IsOptional()
    @IsNumber()
    depth?: number;

    @IsOptional()
    @IsEnum(ToolInstanceStatus)
    status?: ToolInstanceStatus;
}
