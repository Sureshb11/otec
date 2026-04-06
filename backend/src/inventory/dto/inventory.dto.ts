import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateInventoryDto {
    @IsString()
    itemName: string;

    @IsString()
    category: string;

    @IsOptional()
    @IsNumber()
    quantity?: number;

    @IsOptional()
    @IsString()
    unit?: string;

    @IsOptional()
    @IsNumber()
    minStock?: number;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateInventoryDto {
    @IsOptional()
    @IsString()
    itemName?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsNumber()
    quantity?: number;

    @IsOptional()
    @IsString()
    unit?: string;

    @IsOptional()
    @IsNumber()
    minStock?: number;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    description?: string;
}
